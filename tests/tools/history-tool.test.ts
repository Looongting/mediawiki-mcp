import { describe, it, expect, vi } from 'vitest';
import { history } from '../../src/tools/history-tool.js';
import { mockDeps } from '../helpers.js';

describe('wiki_history 工具', () => {
  it('应返回修订历史列表', async () => {
    const deps = mockDeps();
    const result = await history(deps, { page: 'TestPage' });

    const text = result.content[0].text;
    expect(text).toContain('1 条记录');
    expect(text).toContain('TestBot');
    expect(text).toContain('test');
  });

  it('小编辑应被标记', async () => {
    const deps = mockDeps({
      wikiClient: {
        getHistory: vi.fn().mockResolvedValue({
          items: [
            { revision: 3, timestamp: '2026-05-31T00:00:00Z', user: 'TestBot', comment: 'minor fix', minor: true },
          ],
          has_more: false,
        }),
      },
    });

    const result = await history(deps, { page: 'TestPage' });
    expect(result.content[0].text).toContain('(小编辑)');
  });

  it('无历史时应返回对应消息', async () => {
    const deps = mockDeps({
      wikiClient: {
        getHistory: vi.fn().mockResolvedValue({ items: [], has_more: false }),
      },
    });

    const result = await history(deps, { page: 'NewPage' });
    expect(result.content[0].text).toContain('没有修订历史');
  });

  it('有更多记录时应显示分页游标', async () => {
    const deps = mockDeps({
      wikiClient: {
        getHistory: vi.fn().mockResolvedValue({
          items: [
            { revision: 2, timestamp: '2026-05-31T00:00:00Z', user: 'TestBot', comment: 'test', minor: false },
          ],
          has_more: true,
          continue_cursor: '{"rvcontinue":"20260531000000|2","continue":"-||"}',
        }),
      },
    });

    const result = await history(deps, { page: 'TestPage' });
    expect(result.content[0].text).toContain('还有更多');
    expect(result.content[0].text).toContain('续传游标');
  });

  it('应传递 limit 参数', async () => {
    const mockGetHistory = vi.fn().mockResolvedValue({
      items: [
        { revision: 2, timestamp: '2026-05-31T00:00:00Z', user: 'TestBot', comment: 'test', minor: false },
      ],
      has_more: false,
    });
    const deps = mockDeps({ wikiClient: { getHistory: mockGetHistory } });

    await history(deps, { page: 'TestPage', limit: 5 });
    expect(mockGetHistory).toHaveBeenCalledWith('TestPage', 5, undefined);
  });

  it('应传递 offset 参数', async () => {
    const mockGetHistory = vi.fn().mockResolvedValue({
      items: [
        { revision: 1, timestamp: '2026-05-30T00:00:00Z', user: 'OldBot', comment: '', minor: false },
      ],
      has_more: false,
    });
    const deps = mockDeps({ wikiClient: { getHistory: mockGetHistory } });

    await history(deps, { page: 'TestPage', offset: '{"rvcontinue":"abc"}' });
    expect(mockGetHistory).toHaveBeenCalledWith('TestPage', undefined, '{"rvcontinue":"abc"}');
  });
});
