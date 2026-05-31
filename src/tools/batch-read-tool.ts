import type { ToolDependencies } from './register.js';
import { truncateContent, truncationNote } from '../utils/content-limiter.js';

/** MediaWiki API 单次批量读取最多 50 个页面 */
const MAX_BATCH_PAGES = 50;

export async function batchRead(deps: ToolDependencies, args: { pages: string[]; site?: string }) {
  // 检查页面数量上限
  if (args.pages.length > MAX_BATCH_PAGES) {
    return {
      content: [{
        type: 'text',
        text: `请求了 ${args.pages.length} 个页面，但单次最多只能读取 ${MAX_BATCH_PAGES} 个页面（MediaWiki API 限制）。请分批请求。`,
      }],
    };
  }

  // 去重并保留顺序
  const uniquePages = [...new Set(args.pages)];
  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const result = await wikiClient.batchReadPages(uniquePages);

  if (result.missing_count === uniquePages.length) {
    return {
      content: [{ type: 'text', text: `所有 ${uniquePages.length} 个页面均不存在。` }],
    };
  }

  const parts: string[] = [
    `## 批量读取结果`,
    uniquePages.length < args.pages.length
      ? `- 请求: ${args.pages.length} 个页面（去重后 ${uniquePages.length}）`
      : `- 请求: ${args.pages.length} 个页面`,
    `- 存在: ${uniquePages.length - result.missing_count} 个`,
    `- 不存在: ${result.missing_count} 个`,
    '',
  ];

  for (const p of result.pages) {
    if (!p.exists) {
      parts.push(`### [缺失] ${p.title}`);
      parts.push('');
      continue;
    }

    // 使用统一的 MCP_CONTENT_MAX_BYTES 截断（UTF-8 安全）
    const { content: displayContent, truncated, originalBytes } = truncateContent(p.content);
    const sizeInfo = truncated
      ? ` (r${p.last_revision}, ${p.content.length} 字符)`
      : ` (r${p.last_revision}, ${p.content.length} 字符)`;

    parts.push(`### ${p.title}${sizeInfo}`);
    parts.push(displayContent);
    if (truncated) {
      parts.push(truncationNote(originalBytes));
    }
    parts.push('');
  }

  return {
    content: [{ type: 'text', text: parts.join('\n') }],
  };
}
