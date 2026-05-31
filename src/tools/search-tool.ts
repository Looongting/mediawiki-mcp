import type { ToolDependencies } from './register.js';

export async function search(deps: ToolDependencies, args: {
  query: string;
  mode?: 'text' | 'prefix';
  limit?: number;
  namespace?: number;
  offset?: string;
  site?: string;
}) {
  const mode = args.mode || 'text';
  const wikiClient = deps.wikiClientManager.getClient(args.site);

  // 前缀搜索模式
  if (mode === 'prefix') {
    const result = await wikiClient.prefixSearch(args.query, args.limit, args.namespace);

    if (result.items.length === 0) {
      return {
        content: [{ type: 'text', text: `未找到以 "${args.query}" 开头的页面` }],
      };
    }

    const parts: string[] = [
      `## 前缀搜索结果: "${args.query}"`,
      `共 ${result.items.length} 个匹配`,
      result.has_more ? `(还有更多，使用 offset="${result.continue_cursor}" 继续)` : '',
      '',
    ];

    for (const r of result.items) {
      parts.push(`- **${r.title}** (ID: ${r.page_id})`);
    }

    if (result.has_more && result.continue_cursor) {
      parts.push(`\n---\n续传游标: \`${result.continue_cursor}\``);
    }

    return {
      content: [{ type: 'text', text: parts.join('\n') }],
    };
  }

  // 全文搜索模式（默认）
  const result = await wikiClient.searchPages(args.query, args.limit, args.namespace, args.offset);

  if (result.items.length === 0) {
    return {
      content: [{ type: 'text', text: `未找到与 "${args.query}" 相关的页面` }],
    };
  }

  const parts: string[] = [
    `## 搜索结果: "${args.query}"`,
    `共 ${result.items.length} 个结果`,
    result.has_more ? `(还有更多，使用 offset="${result.continue_cursor}" 继续)` : '',
    '',
  ];

  for (const r of result.items) {
    const snippet = r.snippet.replace(/<[^>]*>/g, '');
    parts.push(`- **${r.title}** (ID: ${r.page_id})`);
    if (snippet) parts.push(`  ${snippet.substring(0, 150)}`);
  }

  if (result.has_more && result.continue_cursor) {
    parts.push(`\n---\n续传游标: \`${result.continue_cursor}\``);
  }

  return {
    content: [{ type: 'text', text: parts.join('\n') }],
  };
}
