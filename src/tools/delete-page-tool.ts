import type { ToolDependencies } from './register.js';

export async function deletePage(deps: ToolDependencies, args: { page: string; reason?: string; confirm: boolean; site?: string }) {
  // 安全确认机制：破坏性操作必须显式确认
  if (!args.confirm) {
    return {
      content: [{
        type: 'text',
        text: `⚠️ 即将删除页面 "${args.page}"。此操作不可撤销！\n\n`
          + `请再次调用 wiki_delete_page 并设置 confirm: true 以确认删除。\n`
          + `建议先使用 wiki_read 查看页面内容，或设置 reason 参数记录删除原因。`,
      }],
    };
  }

  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const result = await wikiClient.deletePage(args.page, args.reason);

  return {
    content: [{ type: 'text', text: result.message }],
  };
}
