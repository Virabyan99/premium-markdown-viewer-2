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
  list: { ul: 'list-disc pl-6', ol: 'list-decimal pl-6' },
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
  const observerRef = useRef<IntersectionObserver | null>(null);

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

  // Create the observer once on mount
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        console.log('Observer triggered with entries:', entries);
        const currentPage = entries.find((e) => e.isIntersecting)?.target.getAttribute('data-page');
        if (currentPage) {
          const pageNum = parseInt(currentPage, 10);
          console.log('Page in view:', pageNum);
          setVisiblePages((prev) => {
            const newVisiblePages = [
              Math.max(0, pageNum - 1),
              pageNum,
              Math.min(pageNum + 1, pageCount - 1),
            ];
            // Prevent unnecessary updates if pages are already visible
            if (newVisiblePages.every((p) => prev.includes(p)) && prev.length === newVisiblePages.length) {
              return prev;
            }
            return newVisiblePages;
          });
        }
      },
      { root: containerRef.current, threshold: 0.1 }
    );

    // Cleanup on unmount
    return () => {
      observerRef.current?.disconnect();
    };
  }, []); // Empty dependency array: runs once

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
                ref={(el) => {
                  // Unobserve previous element if it exists
                  if (pageRefs.current[idx] && observerRef.current) {
                    observerRef.current.unobserve(pageRefs.current[idx]);
                  }
                  pageRefs.current[idx] = el;
                  // Observe new element when mounted
                  if (el && observerRef.current) {
                    observerRef.current.observe(el);
                  }
                }}
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