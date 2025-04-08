import { Root, RootContent } from 'mdast';

export function mdastToLexicalJson(mdast: Root): string {
  // Define the root structure expected by Lexical
  const root = {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [],
  };

  // Process each AST node and build Lexical nodes
  mdast.children.forEach((node: RootContent) => {
    switch (node.type) {
      case 'paragraph':
        const paragraph = {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: node.children
            .map((child) => {
              if (child.type === 'text') {
                return {
                  type: 'text',
                  text: child.value,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                };
              }
              return null; // Handle other inline nodes if needed
            })
            .filter(Boolean),
        };
        root.children.push(paragraph);
        break;

      case 'heading':
        const heading = {
          type: 'heading',
          tag: `h${node.depth}`,
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: node.children
            .map((child) => {
              if (child.type === 'text') {
                return {
                  type: 'text',
                  text: child.value,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  version: 1,
                };
              }
              return null; // Handle other inline nodes if needed
            })
            .filter(Boolean),
        };
        root.children.push(heading);
        break;
    }
  });

  // Wrap the root in the expected Lexical format
  return JSON.stringify({ root });
}