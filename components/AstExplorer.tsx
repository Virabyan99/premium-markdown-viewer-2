'use client';

import { Root, RootContent } from 'mdast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export default function AstExplorer({ ast }: { ast: Root }) {
  const renderNode = (node: RootContent, depth: number = 0, path: string) => {
    const indent = '  '.repeat(depth);
    return (
      <li key={path}> {/* Use path as the unique key */}
        <Collapsible defaultOpen={depth < 1}>
          <CollapsibleTrigger className="text-blue-600 hover:underline">
            {node.type} {node.type === 'heading' && `(Level ${node.depth})`}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="ml-4 text-sm text-gray-700">
              {'value' in node && <li>{indent}Value: "{node.value}"</li>}
              {'children' in node &&
                node.children.map((child, index) =>
                  renderNode(child, depth + 1, `${path}-${index}`)
                )}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </li>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AST Explorer</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {ast.children.map((node, index) => renderNode(node, 0, index.toString()))}
        </ul>
      </CardContent>
    </Card>
  );
}