import type { ToolDependencies } from './register.js';
import type { UploadFileInput, UploadFileResult } from '../types.js';

export async function uploadFile(
  deps: ToolDependencies,
  args: UploadFileInput,
) {
  const { filename, file_url, file_path, comment, text, site } = args;

  // Validate: must have either file_url or file_path
  if (!file_url && !file_path) {
    return {
      content: [{
        type: 'text' as const,
        text: '⚠️ 错误: 必须提供 file_url（远程 URL）或 file_path（本地文件路径）之一。',
      }],
      isError: true,
    };
  }

  if (file_url && file_path) {
    return {
      content: [{
        type: 'text' as const,
        text: '⚠️ 错误: file_url 和 file_path 不能同时指定，请选择其中一个。',
      }],
      isError: true,
    };
  }

  try {
    const client = deps.wikiClientManager.getClient(site);

    const result: UploadFileResult = await client.uploadFile({
      filename,
      file_url,
      file_path,
      comment,
      text,
    });

    const lines = [
      `## 文件上传: ${result.filename}`,
      '',
      `- 状态: ${result.success ? '✅ 成功' : '❌ 失败'}`,
      `- 消息: ${result.message}`,
    ];

    if (result.url) {
      lines.push(`- 文件 URL: ${result.url}`);
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: 'text', text: `❌ 上传失败: ${message}` }],
      isError: true,
    };
  }
}
