'use client';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { HeadingNode } from '@lexical/rich-text'; // Import HeadingNode
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const theme = {
  paragraph: 'mb-4',
  heading: { h1: 'text-3xl font-bold mb-4', h2: 'text-2xl font-semibold mb-3' },
  text: { bold: 'font-bold', italic: 'italic' },
};

function EditorStateLoader({ json }: { json: string }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (json) {
      try {
        const state = editor.parseEditorState(json);
        console.log('Parsed Editor State:', state); // Log for debugging
        if (state && !state.isEmpty()) {
          editor.setEditorState(state);
        } else {
          editor.update(() => {
            const root = $getRoot();
            if (root.getFirstChild() === null) {
              const paragraph = $createParagraphNode();
              paragraph.append($createTextNode('No content available'));
              root.append(paragraph);
            }
          });
        }
      } catch (error) {
        console.error('Failed to parse editor state:', error);
        editor.update(() => {
          const root = $getRoot();
          if (root.getFirstChild() === null) {
            const paragraph = $createParagraphNode();
            paragraph.append($createTextNode('Error loading content'));
            root.append(paragraph);
          }
        });
      }
    } else {
      editor.update(() => {
        const root = $getRoot();
        if (root.getFirstChild() === null) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode('Upload a file to see content'));
          root.append(paragraph);
        }
      });
    }
  }, [editor, json]);
  return null;
}

export default function LexicalViewer({ json }: { json: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <LexicalComposer
          initialConfig={{
            namespace: 'MDViewer',
            theme,
            editable: false,
            onError: console.error,
            nodes: [HeadingNode], // Ensure HeadingNode is registered
          }}
        >
          <EditorStateLoader json={json} />
          <RichTextPlugin
            contentEditable={<ContentEditable className="prose max-w-none" />}
            placeholder={null}
            ErrorBoundary={LexicalErrorBoundary}
          />
        </LexicalComposer>
      </CardContent>
    </Card>
  );
}