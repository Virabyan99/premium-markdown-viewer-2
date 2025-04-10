// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import FileDrop from '@/components/FileDrop';
import LexicalViewer from '@/components/LexicalViewer';
import AstExplorer from '@/components/AstExplorer';
import { parseMarkdownToAst } from '@/lib/parseMarkdownAst';
import { mdastToLexicalJson } from '@/lib/mdastToLexical';
import { lintMarkdown, LintMessage } from '@/lib/lintMarkdown';
import { repairMarkdown } from '@/lib/repairMarkdown'; // Import repair utility
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Root } from 'mdast';

export default function HomePage() {
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [fixedMarkdown, setFixedMarkdown] = useState<string | null>(null); // State for repaired Markdown
  const [lexicalJson, setLexicalJson] = useState<string | null>(null);
  const [markdownAst, setMarkdownAst] = useState<Root | null>(null);
  const [lintIssues, setLintIssues] = useState<LintMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process the original Markdown
  useEffect(() => {
    if (!rawMarkdown) return;
    setLoading(true);
    setError(null);
    Promise.all([
      parseMarkdownToAst(rawMarkdown),
      lintMarkdown(rawMarkdown),
    ])
      .then(([ast, issues]) => {
        setMarkdownAst(ast);
        setLintIssues(issues);
        const json = mdastToLexicalJson(ast);
        setLexicalJson(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error processing Markdown:', err);
        setError('Failed to process Markdown');
        setLoading(false);
      });
  }, [rawMarkdown]);

  // Process the repaired Markdown when fixedMarkdown changes
  useEffect(() => {
    if (!fixedMarkdown) return;
    setLoading(true);
    Promise.all([
      parseMarkdownToAst(fixedMarkdown),
      lintMarkdown(fixedMarkdown),
    ])
      .then(([ast, issues]) => {
        setMarkdownAst(ast);
        setLintIssues(issues);
        const json = mdastToLexicalJson(ast);
        setLexicalJson(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error processing repaired Markdown:', err);
        setError('Failed to process repaired Markdown');
        setLoading(false);
      });
  }, [fixedMarkdown]);

  const exportToHtml = () => {
    if (!lexicalJson) return;
    try {
      const state = JSON.parse(lexicalJson);
      const html = state.root.children
        .map((node: any) => {
          if (node.type === 'heading') {
            const level = node.tag.slice(1);
            const text = node.children.map((c: any) => c.text).join('');
            return `<h${level}>${text}</h${level}>`;
          }
          if (node.type === 'paragraph') {
            const text = node.children.map((c: any) => c.text).join('');
            return `<p>${text}</p>`;
          }
          if (node.type === 'code') {
            const code = node.children[0].text;
            return `<pre><code>${code}</code></pre>`;
          }
          if (node.type === 'list') {
            const listType = node.listType === 'bullet' ? 'ul' : 'ol';
            const items = node.children
              .map((item: any) =>
                `<li>${item.children.map((c: any) => c.children.map((t: any) => t.text).join('')).join('')}</li>`
              )
              .join('');
            return `<${listType}>${items}</${listType}>`;
          }
          return '';
        })
        .join('\n');
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'markdown.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to HTML:', error);
    }
  };

  const handleRepair = async () => {
    if (!rawMarkdown || !lintIssues.length) return;
    setLoading(true);
    const repaired = await repairMarkdown(rawMarkdown, lintIssues);
    setFixedMarkdown(repaired);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Markdown Viewer</h1>
        <FileDrop onFileRead={setRawMarkdown} />
        {rawMarkdown && (
          <div className="flex flex-col space-y-4">
            {lintIssues.length > 0 && (
              <Card className="bg-yellow-50 border-yellow-300">
                <CardContent className="pt-6 text-yellow-800">
                  <p className="font-medium">⚠️ Markdown Issues Detected:</p>
                  <ul className="list-disc list-inside text-sm mt-2">
                    {lintIssues.map((msg, i) => (
                      <li key={i}>
                        Line {msg.line}, Col {msg.column}: {msg.reason}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleRepair} className="mt-4">
                    Fix with AI (Mock)
                  </Button>
                </CardContent>
              </Card>
            )}
            <Tabs defaultValue="preview" className="w-full">
              <div className="flex justify-between items-center">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                  <TabsTrigger value="ast">AST</TabsTrigger>
                </TabsList>
                <Button onClick={exportToHtml} variant="secondary" className="ml-4">
                  Export HTML
                </Button>
              </div>
              <TabsContent value="preview" className="mt-4 transition-opacity duration-300">
                {lexicalJson && !loading && !error && <LexicalViewer json={lexicalJson} />}
              </TabsContent>
              <TabsContent value="raw" className="mt-4 transition-opacity duration-300">
                <Card>
                  <CardContent className="pt-6">
                    <pre className="text-sm text-gray-700 max-h-[400px] overflow-auto">
                      {fixedMarkdown || rawMarkdown}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="ast" className="mt-4 transition-opacity duration-300">
                {markdownAst && <AstExplorer ast={markdownAst} />}
              </TabsContent>
            </Tabs>
            {loading && (
              <Card>
                <CardContent className="pt-6 text-gray-500">Loading...</CardContent>
              </Card>
            )}
            {error && (
              <Card className="border-red-300">
                <CardContent className="pt-6 text-red-500">{error}</CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}