// components/LexicalViewer.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { CodeNode } from '@lexical/code';
import { ListNode, ListItemNode } from '@lexical/list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const theme = {
  paragraph: 'mb-4',
  heading: { h1: 'text-3xl font-bold mb-4', h2: 'text-2xl font-semibold mb-3' },
  text: { bold: 'font-bold', italic: 'italic' },
  code: 'bg-gray-800 text-white p-2 rounded block font-mono text-sm',
  list: {
    ul: 'list-disc pl-6',
    ol: 'list-decimal pl-6',
  },
};

function Page({ pageJson }: { pageJson: string }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    try {
      const state = editor.parseEditorState(pageJson);
      editor.setEditorState(state);
    } catch (error) {
      console.error('Error setting page state:', error);
    }
  }, [editor, pageJson]);
  return (
    <RichTextPlugin
      contentEditable={<ContentEditable className="prose max-w-none p-2" />}
      placeholder={null}
      ErrorBoundary={LexicalErrorBoundary}
    />
  );
}

export default function LexicalViewer({ json }: { json: string }) {
  const [visiblePages, setVisiblePages] = useState([0, 1, 2]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  let parsedState;
  try {
    parsedState = JSON.parse(json);
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>Error loading content</CardContent>
      </Card>
    );
  }

  const nodesPerPage = 5; // Adjustable based on performance needs
  const totalNodes = parsedState.root.children.length;
  const pageCount = Math.ceil(totalNodes / nodesPerPage);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const currentPage = entries.find((e) => e.isIntersecting)?.target.getAttribute('data-page');
        if (currentPage) {
          const pageNum = parseInt(currentPage, 10);
          setVisiblePages([
            Math.max(0, pageNum - 1),
            pageNum,
            Math.min(pageNum + 1, pageCount - 1),
          ]);
        }
      },
      { root: containerRef.current, threshold: 0.5 }
    );

    pageRefs.current.forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, [pageCount]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="max-h-[80vh] overflow-y-auto space-y-4">
          {Array.from({ length: pageCount }).map((_, idx) => {
            if (!visiblePages.includes(idx)) return null;
            const start = idx * nodesPerPage;
            const end = start + nodesPerPage;
            const pageNodes = parsedState.root.children.slice(start, end);
            const pageJson = JSON.stringify({
              root: { ...parsedState.root, children: pageNodes },
            });
            return (
              <div
                key={idx}
                ref={(el) => (pageRefs.current[idx] = el)}
                data-page={idx}
                className="transition-opacity duration-300"
              >
                <LexicalComposer
                  initialConfig={{
                    namespace: `Page${idx}`,
                    theme,
                    nodes: [HeadingNode, CodeNode, ListNode, ListItemNode],
                    editable: false,
                    onError: console.error,
                  }}
                >
                  <Page pageJson={pageJson} />
                </LexicalComposer>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}