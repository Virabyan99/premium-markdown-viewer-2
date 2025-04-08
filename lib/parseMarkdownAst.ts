import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root } from 'mdast';

export async function parseMarkdownToAst(content: string): Promise<Root> {
  return unified().use(remarkParse).parse(content) as Root;
}