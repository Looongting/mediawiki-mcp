import { describe, it, expect, vi } from 'vitest';
import { getFile } from '../../src/tools/get-file-tool.js';
import { mockDeps } from '../helpers.js';

describe('wiki_get_file 工具', () => {
  it('文件存在时应返回详细信息', async () => {
    const deps = mockDeps({
      wikiClient: {
        getFile: vi.fn().mockResolvedValue({
          filename: 'File:Test.png',
          url: 'https://example.com/images/test.png',
          description_url: 'https://wiki.example.com/File:Test.png',
          size_bytes: 102400,
          width: 800,
          height: 600,
          mime: 'image/png',
          uploader: 'Uploader',
          uploaded_at: '2026-05-30T10:00:00Z',
          exists: true,
        }),
      },
    });

    const result = await getFile(deps, { filename: 'Test.png' });
    expect(result.content[0].text).toContain('Test.png');
    expect(result.content[0].text).toContain('https://example.com/images/test.png');
    expect(result.content[0].text).toContain('image/png');
    expect(result.content[0].text).toContain('100.0 KB');
  });

  it('文件不存在时应提示', async () => {
    const deps = mockDeps({
      wikiClient: {
        getFile: vi.fn().mockResolvedValue({
          filename: 'File:Missing.png',
          url: '',
          description_url: '',
          exists: false,
        }),
      },
    });

    const result = await getFile(deps, { filename: 'Missing.png' });
    expect(result.content[0].text).toContain('不存在');
  });
});
