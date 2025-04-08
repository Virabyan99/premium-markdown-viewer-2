'use client';

import { useState, useEffect } from 'react';
import FileDrop from '@/components/FileDrop';
import LexicalViewer from '@/components/LexicalViewer';
import { parseMarkdownToAst } from '@/lib/parseMarkdownAst';
import { mdastToLexicalJson } from '@/lib/mdastToLexical';
import type { Root } from 'mdast';

export default function HomePage() {
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [lexicalJson, setLexicalJson] = useState<string | null>(null);

  useEffect(() => {
    if (!rawMarkdown) return;
    console.log('Raw Markdown:', rawMarkdown); // Log raw Markdown
    parseMarkdownToAst(rawMarkdown).then((ast: Root) => {
      console.log('Parsed AST:', ast); // Log parsed AST
      const json = mdastToLexicalJson(ast);
      console.log('Lexical JSON:', json); // Log generated Lexical JSON
      setLexicalJson(json);
    });
  }, [rawMarkdown]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Markdown Viewer</h1>
        <FileDrop onFileRead={setRawMarkdown} />
        {lexicalJson && <LexicalViewer json={lexicalJson} />}
      </div>
    </main>
  );
}