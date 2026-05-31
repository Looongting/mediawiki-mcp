import type { ToolDependencies } from './register.js';
import { truncateContent, truncationNote } from '../utils/content-limiter.js';

export async function read(deps: ToolDependencies, args: { page: string; section?: number; site?: string }) {
  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const result = await wikiClient.readPage(args.page);

  if (!result.exists) {
    return {
      content: [{ type: 'text', text: `页面 "${args.page}" 不存在。\n\n你可以使用 wiki_edit 工具创建它。` }],
    };
  }

  // Optionally extract a section
  let content = result.content;
  if (args.section !== undefined && content) {
    const sections = content.split(/(?=^=)/m);
    if (args.section < sections.length) {
      content = sections[args.section].trim();
    }
  }

  // Content size truncation (UTF-8 safe)
  const { content: displayContent, truncated, originalBytes } = truncateContent(content);

  const meta = `页面: ${result.title}
修订版本: ${result.last_revision}
长度: ${displayContent.length} 字符
--- 内容开始 ---

`;

  const note = truncated ? truncationNote(originalBytes) : '';

  return {
    content: [{ type: 'text', text: meta + displayContent + note }],
  };
}
