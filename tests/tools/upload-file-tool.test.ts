import { describe, it, expect, vi } from 'vitest';
import { uploadFile } from '../../src/tools/upload-file-tool.js';

function makeDeps(overrides: { uploadFile?: any } = {}) {
  const mockClient = {
    uploadFile: overrides.uploadFile ?? vi.fn().mockResolvedValue({
      success: true,
      filename: 'File:Test.png',
      url: 'https://wiki.example.com/images/test.png',
      message: '文件 "File:Test.png" 已从URL上传成功。',
    }),
  };

  return {
    wikiClientManager: {
      getClient: vi.fn().mockReturnValue(mockClient),
    },
    browserManager: {} as any,
    config: {} as any,
  };
}

describe('wiki_upload_file 工具', () => {
  it('缺少 file_url 和 file_path 时应返回错误', async () => {
    const deps = makeDeps();

    const result = await uploadFile(deps, { filename: 'Test.png' });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('必须提供 file_url');
    expect(result.content[0].text).toContain('file_path');
  });

  it('同时指定 file_url 和 file_path 时应返回错误', async () => {
    const deps = makeDeps();

    const result = await uploadFile(deps, {
      filename: 'Test.png',
      file_url: 'https://example.com/test.png',
      file_path: '/tmp/test.png',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('不能同时指定');
  });

  it('通过 URL 模式上传成功', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      success: true,
      filename: 'File:Test.png',
      url: 'https://wiki.example.com/images/test.png',
      message: '文件 "File:Test.png" 已从URL上传成功。',
    });
    const deps = makeDeps({ uploadFile: mockUpload });

    const result = await uploadFile(deps, {
      filename: 'Test.png',
      file_url: 'https://example.com/test.png',
      comment: '测试上传',
    });

    expect(result.content[0].text).toContain('✅ 成功');
    expect(result.content[0].text).toContain('File:Test.png');
    expect(mockUpload).toHaveBeenCalledWith({
      filename: 'Test.png',
      file_url: 'https://example.com/test.png',
      file_path: undefined,
      comment: '测试上传',
      text: undefined,
    });
  });

  it('通过本地文件路径上传成功', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      success: true,
      filename: 'File:LocalPic.png',
      url: 'https://wiki.example.com/images/LocalPic.png',
      message: '文件 "File:LocalPic.png" 已从本地上传成功。',
    });
    const deps = makeDeps({ uploadFile: mockUpload });

    const result = await uploadFile(deps, {
      filename: 'LocalPic.png',
      file_path: '/tmp/local-pic.png',
    });

    expect(result.content[0].text).toContain('✅ 成功');
    expect(mockUpload).toHaveBeenCalledWith({
      filename: 'LocalPic.png',
      file_url: undefined,
      file_path: '/tmp/local-pic.png',
      comment: undefined,
      text: undefined,
    });
  });

  it('上传失败时返回错误', async () => {
    const mockUpload = vi.fn().mockRejectedValue(new Error('Upload failed: file too large'));
    const deps = makeDeps({ uploadFile: mockUpload });

    const result = await uploadFile(deps, {
      filename: 'BigFile.zip',
      file_url: 'https://example.com/big.zip',
    });

    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('上传失败');
    expect(result.content[0].text).toContain('file too large');
  });

  it('包含文件 URL 在成功响应中', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      success: true,
      filename: 'File:Doc.pdf',
      url: 'https://wiki.example.com/images/5/5a/Doc.pdf',
      message: '上传成功。',
    });
    const deps = makeDeps({ uploadFile: mockUpload });

    const result = await uploadFile(deps, {
      filename: 'Doc.pdf',
      file_url: 'https://cdn.example.com/doc.pdf',
    });

    expect(result.content[0].text).toContain('文件 URL: https://wiki.example.com/images/5/5a/Doc.pdf');
  });

  it('传递 text 参数给上传方法', async () => {
    const mockUpload = vi.fn().mockResolvedValue({
      success: true,
      filename: 'File:WithDesc.png',
      url: '',
      message: '已上传。',
    });
    const deps = makeDeps({ uploadFile: mockUpload });

    await uploadFile(deps, {
      filename: 'WithDesc.png',
      file_url: 'https://example.com/img.png',
      text: '== 描述 ==\n测试图片。',
    });

    expect(mockUpload).toHaveBeenCalledWith(
      expect.objectContaining({ text: '== 描述 ==\n测试图片。' })
    );
  });
});
