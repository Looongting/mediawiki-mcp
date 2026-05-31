import type { ToolDependencies } from './register.js';

export async function categoryMembers(deps: ToolDependencies, args: { category: string; limit?: number; offset?: string; site?: string }) {
  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const result = await wikiClient.getCategoryMembers(args.category, args.limit, args.offset);

  if (result.members.length === 0) {
    return {
      content: [{ type: 'text', text: `分类 "${args.category}" 没有成员页面。` }],
    };
  }

  const parts: string[] = [
    `## 分类成员: ${args.category}`,
    `共 ${result.members.length} 个成员`,
    result.has_more ? `(还有更多，使用 offset="${result.continue_cursor}" 继续)` : '',
    '',
  ];

  for (const m of result.members) {
    const nsLabel = m.ns === 0 ? '' : `, 命名空间: ${m.ns}`;
    parts.push(`- **${m.title}** (ID: ${m.page_id}${nsLabel})`);
  }

  if (result.has_more && result.continue_cursor) {
    parts.push(`\n---\n续传游标: \`${result.continue_cursor}\``);
  }

  return {
    content: [{ type: 'text', text: parts.join('\n') }],
  };
}
