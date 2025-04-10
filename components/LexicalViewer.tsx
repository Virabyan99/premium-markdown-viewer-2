'use client';

import { useState, useRef } from 'react';
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
  list: { ul: 'list-disc pl-6', ol: 'list-decimal pl-6' },
};

function Page({ pageJson }: { pageJson: string }) {
  const [editor] = useLexicalComposerContext();
  const isMounted = useRef(false);
  
  if (!isMounted.current) {
    try {
      const state = editor.parseEditorState(pageJson);
      editor.setEditorState(state);
      isMounted.current = true;
    } catch (error) {
      console.error('Error setting page state:', error);
    }
  }
  
  return (
    <RichTextPlugin
      contentEditable={<ContentEditable className="prose max-w-none p-2" />}
      placeholder={null}
      ErrorBoundary={LexicalErrorBoundary}
    />
  );
}

export default function LexicalViewer({ json }: { json: string }) {
  const [visiblePageCount, setVisiblePageCount] = useState(3); // Start with 3 pages
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastJsonRef = useRef<string | null>(null);

  // Parse JSON and calculate pages
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

  const nodesPerPage = 5;
  const totalNodes = parsedState.root.children.length;
  const pageCount = Math.ceil(totalNodes / nodesPerPage);

  // Reset visiblePageCount when json changes (new file uploaded)
  if (lastJsonRef.current !== json) {
    setVisiblePageCount(3);
    lastJsonRef.current = json;
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }

  // Initialize or update observer (runs only once per render if needed)
  if (!observerRef.current) {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log('Sentinel in view, loading more pages');
          setVisiblePageCount((prev) => Math.min(prev + 3, pageCount));
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );
    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }
  }

  // Generate visible pages
  const visiblePages = Array.from({ length: Math.min(visiblePageCount, pageCount) }, (_, i) => i);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="max-h-[80vh] overflow-y-auto space-y-4">
          {visiblePages.map((idx) => {
            const start = idx * nodesPerPage;
            const end = start + nodesPerPage;
            const pageNodes = parsedState.root.children.slice(start, end);
            const pageJson = JSON.stringify({
              root: { ...parsedState.root, children: pageNodes },
            });
            return (
              <div
                key={idx}
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
          {visiblePageCount < pageCount && (
            <div
              ref={(el) => {
                if (el && observerRef.current && sentinelRef.current !== el) {
                  if (sentinelRef.current) observerRef.current.unobserve(sentinelRef.current);
                  observerRef.current.observe(el);
                  sentinelRef.current = el;
                }
              }}
              className="h-10"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}