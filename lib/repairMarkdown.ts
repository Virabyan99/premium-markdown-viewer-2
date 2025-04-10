// src/lib/repairMarkdown.ts
import { LintMessage } from './lintMarkdown';

export async function repairMarkdown(markdown: string, issues: LintMessage[]): Promise<string> {
  let fixed = markdown
    .split('\n')
    .map((line) => line.trimEnd()) // Remove trailing whitespace
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'); // Normalize multiple newlines to two

  issues.forEach((issue) => {
    if (issue.reason.includes('incorrect indentation')) {
      // Fix indentation for list items (e.g., ensure 2 spaces before '-')
      fixed = fixed.replace(/^\s*-/gm, '  -');
    }
    if (issue.reason.includes('space after #')) {
      // Add space after '#' in headings
      fixed = fixed.replace(/^#([^ ])/, '# $1');
    }
  });

  return fixed;
}