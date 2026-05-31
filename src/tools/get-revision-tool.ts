import type { ToolDependencies } from './register.js';

export async function getRevision(deps: ToolDependencies, args: { page?: string; revision: number; site?: string }) {
  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const rev = await wikiClient.getRevision(args.revision, args.page);

  const parts: string[] = [
    `## 修订详情`,
    `- 页面: ${rev.page_title}`,
    `- 修订版本: r${rev.revision}`,
    `- 时间: ${rev.timestamp.replace('T', ' ').substring(0, 19)}`,
    `- 用户: ${rev.user}`,
    rev.comment ? `- 摘要: ${rev.comment}` : '',
    rev.minor ? `- 小编辑: 是` : '',
    `- 内容长度: ${rev.content.length} 字符`,
    '',
    `--- 内容开始 ---`,
    '',
    rev.content,
  ];

  return {
    content: [{ type: 'text', text: parts.filter(Boolean).join('\n') }],
  };
}
