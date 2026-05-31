import { describe, it, expect, vi } from 'vitest';
import { recentChanges } from '../../src/tools/recent-changes-tool.js';
import { mockDeps } from '../helpers.js';

describe('wiki_recent_changes 工具', () => {
  it('有更改时应返回列表', async () => {
    const deps = mockDeps({
      wikiClient: {
        getRecentChanges: vi.fn().mockResolvedValue({
          items: [
            {
              title: 'Page1',
              page_id: 1,
              revision: 100,
              type: 'edit',
              user: 'User1',
              timestamp: '2026-05-31T12:00:00Z',
              comment: 'fixed typo',
              minor: true,
              bot: false,
              new_page: false,
              ns: 0,
              old_revision: 99,
            },
            {
              title: 'Page2',
              page_id: 2,
              revision: 200,
              type: 'new',
              user: 'User2',
              timestamp: '2026-05-31T11:00:00Z',
              comment: 'created page',
              minor: false,
              bot: false,
              new_page: true,
              ns: 0,
              old_revision: 0,
            },
          ],
          has_more: false,
        }),
      },
    });

    const result = await recentChanges(deps, { limit: 2 });
    expect(result.content[0].text).toContain('Page1');
    expect(result.content[0].text).toContain('Page2');
    expect(result.content[0].text).toContain('User1');
    expect(result.content[0].text).toContain('新');
  });

  it('无更改时应返回空提示', async () => {
    const deps = mockDeps({
      wikiClient: {
        getRecentChanges: vi.fn().mockResolvedValue({ items: [], has_more: false }),
      },
    });

    const result = await recentChanges(deps, {});
    expect(result.content[0].text).toContain('没有匹配');
  });

  it('应支持过滤参数', async () => {
    const deps = mockDeps({
      wikiClient: {
        getRecentChanges: vi.fn().mockResolvedValue({ items: [], has_more: false }),
      },
    });

    await recentChanges(deps, { user: 'BotUser', type: 'edit', namespace: 10 });
    expect(deps.wikiClientManager.getClient().getRecentChanges).toHaveBeenCalledWith({
      limit: undefined,
      namespace: 10,
      user: 'BotUser',
      type: 'edit',
      offset: undefined,
    });
  });
});
