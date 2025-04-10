// src/lib/lintMarkdown.ts
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify'; // Add this import
import remarkLint from 'remark-lint';
import remarkPresetLintRecommended from 'remark-preset-lint-recommended';
import { VFile } from 'vfile';

export type LintMessage = {
  reason: string;
  line: number | null;
  column: number | null;
};

export async function lintMarkdown(markdown: string): Promise<LintMessage[]> {
  const file = new VFile({ value: markdown });
  await unified()
    .use(remarkParse)          // Parser: Markdown to AST
    .use(remarkStringify)      // Compiler: AST to Markdown (fixes the error)
    .use(remarkLint)           // Linting plugin
    .use(remarkPresetLintRecommended) // Preset with linting rules
    .process(file);
  return file.messages.map((m) => ({
    reason: m.reason,
    line: m.line ?? null,
    column: m.column ?? null,
  }));
}