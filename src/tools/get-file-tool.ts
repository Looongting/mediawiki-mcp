import type { ToolDependencies } from './register.js';

export async function getFile(deps: ToolDependencies, args: { filename: string; site?: string }) {
  const wikiClient = deps.wikiClientManager.getClient(args.site);
  const info = await wikiClient.getFile(args.filename);

  if (!info.exists) {
    return {
      content: [{ type: 'text', text: `文件 "${args.filename}" 不存在。` }],
    };
  }

  const parts: string[] = [
    `## 文件信息: ${info.filename}`,
    `- 文件 URL: ${info.url}`,
    `- 描述页面: ${info.description_url}`,
    info.mime ? `- MIME 类型: ${info.mime}` : '',
    info.size_bytes !== undefined ? `- 大小: ${formatBytes(info.size_bytes)}` : '',
    info.width && info.height ? `- 尺寸: ${info.width} × ${info.height} px` : '',
    info.uploader ? `- 上传者: ${info.uploader}` : '',
    info.uploaded_at ? `- 上传时间: ${info.uploaded_at.replace('T', ' ').substring(0, 19)}` : '',
  ];

  return {
    content: [{ type: 'text', text: parts.filter(Boolean).join('\n') }],
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
