/**
 * 内容大小限制工具 — 所有工具统一使用 MCP_CONTENT_MAX_BYTES 环境变量控制返回内容大小。
 *
 * 环境变量:
 *   MCP_CONTENT_MAX_BYTES — 单次响应最大字节数，默认 50000
 *
 * 截断格式遵循 doc/产品路线图_v1.md P0.4 规范：
 *   [内容已截断，原始大小: N bytes]
 */

/** 获取内容大小上限（字节），从环境变量读取，默认 50000 */
export function getMaxBytes(): number {
  const env = process.env['MCP_CONTENT_MAX_BYTES'];
  if (env) {
    const n = parseInt(env, 10);
    if (!isNaN(n) && n > 0) return n;
  }
  return 50_000;
}

/**
 * 截断内容以不超过 maxBytes 字节（UTF-8 安全）。
 * 返回截断后的内容、是否截断、原始字节数。
 */
export function truncateContent(
  content: string,
  maxBytes?: number
): { content: string; truncated: boolean; originalBytes: number } {
  const originalBytes = Buffer.byteLength(content, 'utf-8');
  const limit = maxBytes ?? getMaxBytes();

  if (originalBytes <= limit) {
    return { content, truncated: false, originalBytes };
  }

  // 在安全边界截断（90%），避免多字节字符被截断后产生 �
  const safeCutoff = Math.floor(limit * 0.9);
  const buf = Buffer.from(content, 'utf-8').subarray(0, safeCutoff);
  const truncatedContent = buf.toString('utf-8').replace(/�+$/, '');

  return {
    content: truncatedContent,
    truncated: true,
    originalBytes,
  };
}

/** 截断标记文本 */
export function truncationNote(originalBytes: number): string {
  return `\n[内容已截断，原始大小: ${originalBytes} bytes]`;
}
