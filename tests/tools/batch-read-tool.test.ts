import { describe, it, expect, vi } from 'vitest';
import { batchRead } from '../../src/tools/batch-read-tool.js';
import { mockDeps } from '../helpers.js';

describe('wiki_batch_read 工具', () => {
  it('多个页面存在时应返回所有内容', async () => {
    const deps = mockDeps({
      wikiClient: {
        batchReadPages: vi.fn().mockResolvedValue({
          pages: [
            { title: 'Page1', content: 'content1', exists: true, last_revision: 1 },
            { title: 'Page2', content: 'content2', exists: true, last_revision: 2 },
          ],
          missing_count: 0,
        }),
      },
    });

    const result = await batchRead(deps, { pages: ['Page1', 'Page2'] });
    expect(result.content[0].text).toContain('Page1');
    expect(result.content[0].text).toContain('Page2');
    expect(result.content[0].text).toContain('批量读取结果');
    expect(result.content[0].text).toContain('content1');
    expect(result.content[0].text).toContain('content2');
  });

  it('部分页面缺失时应标记', async () => {
    const deps = mockDeps({
      wikiClient: {
        batchReadPages: vi.fn().mockResolvedValue({
          pages: [
            { title: 'Page1', content: '', exists: false, last_revision: 0 },
            { title: 'Page2', content: 'ok', exists: true, last_revision: 5 },
          ],
          missing_count: 1,
        }),
      },
    });

    const result = await batchRead(deps, { pages: ['Page1', 'Page2'] });
    expect(result.content[0].text).toContain('[缺失]');
    expect(result.content[0].text).toContain('不存在: 1');
    expect(result.content[0].text).toContain('存在: 1');
  });

  it('全部缺失时应给出提示', async () => {
    const deps = mockDeps({
      wikiClient: {
        batchReadPages: vi.fn().mockResolvedValue({
          pages: [
            { title: 'Ghost', content: '', exists: false, last_revision: 0 },
          ],
          missing_count: 1,
        }),
      },
    });

    const result = await batchRead(deps, { pages: ['Ghost'] });
    expect(result.content[0].text).toContain('均不存在');
  });

  it('大内容页面应截断并标记', async () => {
    // 60KB 内容远超 MCP_CONTENT_MAX_BYTES 默认值 50KB，确保触发截断
    const longContent = 'x'.repeat(60_000);
    const deps = mockDeps({
      wikiClient: {
        batchReadPages: vi.fn().mockResolvedValue({
          pages: [
            { title: 'BigPage', content: longContent, exists: true, last_revision: 1 },
          ],
          missing_count: 0,
        }),
      },
    });

    const result = await batchRead(deps, { pages: ['BigPage'] });
    expect(result.content[0].text).toContain('内容已截断');
    expect(result.content[0].text).toContain('原始大小: 60000 bytes');
    expect(result.content[0].text).toContain('60000 字符');
  });

  it('超过 50 页上限时应拒绝', async () => {
    const manyPages = Array.from({ length: 55 }, (_, i) => `Page${i + 1}`);
    const deps = mockDeps({});

    const result = await batchRead(deps, { pages: manyPages });
    expect(result.content[0].text).toContain('最多只能读取 50 个页面');
  });

  it('重复页面应去重', async () => {
    const deps = mockDeps({
      wikiClient: {
        batchReadPages: vi.fn().mockResolvedValue({
          pages: [
            { title: 'Page1', content: 'content', exists: true, last_revision: 1 },
          ],
          missing_count: 0,
        }),
      },
    });

    const result = await batchRead(deps, { pages: ['Page1', 'Page1', 'Page1'] });
    // 输出应体现去重（请求 3 个页面，去重后 1 个）
    expect(result.content[0].text).toContain('去重后 1');
    // batchReadPages 应只传入去重后的数组
    const client = deps.wikiClientManager.getClient();
    expect(client.batchReadPages).toHaveBeenCalledWith(['Page1']);
  });
});
