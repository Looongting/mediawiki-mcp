import type { ToolDependencies } from './register.js';

export async function recentChanges(deps: ToolDependencies, args: {
  limit?: number;
  namespace?: number;
  user?: string;
  type?: string;
  offset?: string;
  site?: string;
}) {
  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const result = await wikiClient.getRecentChanges({
    limit: args.limit,
    namespace: args.namespace,
    user: args.user,
    type: args.type,
    offset: args.offset,
  });

  if (result.items.length === 0) {
    return {
      content: [{ type: 'text', text: '没有匹配的最近更改。' }],
    };
  }

  const parts: string[] = [
    `## 最近更改`,
    `共 ${result.items.length} 条更改`,
    args.user ? `用户: ${args.user}` : '',
    args.type ? `类型: ${args.type}` : '',
    result.has_more ? `(还有更多，使用 offset="${result.continue_cursor}" 继续)` : '',
    '',
  ];

  for (const rc of result.items) {
    const date = rc.timestamp.replace('T', ' ').substring(0, 19);
    const flags: string[] = [];
    if (rc.new_page) flags.push('新');
    if (rc.minor) flags.push('小');
    if (rc.bot) flags.push('🤖');

    const flagStr = flags.length > 0 ? ` [${flags.join('')}]` : '';
    parts.push(`- r${rc.revision} | ${date} | ${rc.user}${flagStr} | **${rc.title}**`);
    if (rc.comment) parts.push(`  ${rc.comment}`);
  }

  if (result.has_more && result.continue_cursor) {
    parts.push(`\n---\n续传游标: \`${result.continue_cursor}\``);
  }

  return {
    content: [{ type: 'text', text: parts.filter(Boolean).join('\n') }],
  };
}
