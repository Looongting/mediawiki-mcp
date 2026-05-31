import type { ToolDependencies } from './register.js';

export async function history(deps: ToolDependencies, args: { page: string; limit?: number; offset?: string; site?: string }) {
  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const result = await wikiClient.getHistory(args.page, args.limit, args.offset);

  if (result.items.length === 0) {
    return {
      content: [{ type: 'text', text: `页面 "${args.page}" 没有修订历史` }],
    };
  }

  const parts: string[] = [
    `## 修订历史: ${args.page}`,
    `共 ${result.items.length} 条记录`,
    result.has_more ? `(还有更多，使用 offset="${result.continue_cursor}" 继续)` : '',
    '',
  ];

  for (const entry of result.items) {
    const date = entry.timestamp.replace('T', ' ').substring(0, 19);
    const tag = entry.minor ? ' (小编辑)' : '';
    parts.push(`- r${entry.revision} | ${date} | ${entry.user}${tag}`);
    if (entry.comment) parts.push(`  ${entry.comment}`);
  }

  if (result.has_more && result.continue_cursor) {
    parts.push(`\n---\n续传游标: \`${result.continue_cursor}\``);
  }

  return {
    content: [{ type: 'text', text: parts.join('\n') }],
  };
}
