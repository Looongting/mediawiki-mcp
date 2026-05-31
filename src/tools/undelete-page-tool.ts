import type { ToolDependencies } from './register.js';

export async function undeletePage(deps: ToolDependencies, args: { page: string; reason?: string; confirm: boolean; site?: string }) {
  // 安全确认机制
  if (!args.confirm) {
    return {
      content: [{
        type: 'text',
        text: `⚠️ 即将恢复页面 "${args.page}"。\n\n`
          + `请再次调用 wiki_undelete_page 并设置 confirm: true 以确认恢复。\n`
          + `建议设置 reason 参数记录恢复原因。`,
      }],
    };
  }

  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const result = await wikiClient.undeletePage(args.page, args.reason);

  return {
    content: [{ type: 'text', text: result.message }],
  };
}
