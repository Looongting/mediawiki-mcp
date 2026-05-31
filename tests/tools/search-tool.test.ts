import { describe, it, expect, vi } from 'vitest';
import { search } from '../../src/tools/search-tool.js';
import { mockDeps } from '../helpers.js';

describe('search 工具', () => {
  it('应格式化搜索结果', async () => {
    const deps = mockDeps({
      wikiClient: {
        searchPages: vi.fn().mockResolvedValue({
          items: [
            { title: 'Page1', page_id: 1, snippet: 'first result' },
            { title: 'Page2', page_id: 2, snippet: 'second result' },
          ],
          has_more: false,
        }),
      },
    });

    const result = await search(deps, { query: 'test' });
    expect(result.content[0].text).toContain('2 个结果');
    expect(result.content[0].text).toContain('Page1');
    expect(result.content[0].text).toContain('Page2');
  });

  it('无结果时应返回对应消息', async () => {
    const deps = mockDeps({
      wikiClient: {
        searchPages: vi.fn().mockResolvedValue({ items: [], has_more: false }),
      },
    });

    const result = await search(deps, { query: 'nonexistent' });
    expect(result.content[0].text).toContain('未找到');
  });

  it('有更多结果时应显示分页游标', async () => {
    const deps = mockDeps({
      wikiClient: {
        searchPages: vi.fn().mockResolvedValue({
          items: [
            { title: 'Page1', page_id: 1, snippet: 'snippet' },
          ],
          has_more: true,
          continue_cursor: '{"sroffset":20,"continue":"-||"}',
        }),
      },
    });

    const result = await search(deps, { query: 'test' });
    expect(result.content[0].text).toContain('还有更多');
    expect(result.content[0].text).toContain('续传游标');
    expect(result.content[0].text).toContain('{"sroffset":20,"continue":"-||"}');
  });

  it('应传递 offset 参数', async () => {
    const mockSearch = vi.fn().mockResolvedValue({ items: [], has_more: false });
    const deps = mockDeps({ wikiClient: { searchPages: mockSearch } });

    await search(deps, { query: 'test', offset: '{"sroffset":10}' });
    expect(mockSearch).toHaveBeenCalledWith('test', undefined, undefined, '{"sroffset":10}');
  });
});
