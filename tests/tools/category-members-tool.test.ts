import { describe, it, expect, vi } from 'vitest';
import { categoryMembers } from '../../src/tools/category-members-tool.js';
import { mockDeps } from '../helpers.js';

describe('wiki_category_members 工具', () => {
  it('应列出分类成员', async () => {
    const deps = mockDeps({
      wikiClient: {
        getCategoryMembers: vi.fn().mockResolvedValue({
          members: [
            { title: 'Page1', page_id: 1, ns: 0 },
            { title: 'Template:Example', page_id: 10, ns: 10 },
          ],
          has_more: false,
        }),
      },
    });

    const result = await categoryMembers(deps, { category: 'TestCategory' });
    expect(result.content[0].text).toContain('Page1');
    expect(result.content[0].text).toContain('Template:Example');
    expect(result.content[0].text).toContain('命名空间: 10');
    expect(result.content[0].text).toContain('2 个成员');
  });

  it('空分类时应给出提示', async () => {
    const deps = mockDeps({
      wikiClient: {
        getCategoryMembers: vi.fn().mockResolvedValue({
          members: [],
          has_more: false,
        }),
      },
    });

    const result = await categoryMembers(deps, { category: 'EmptyCategory' });
    expect(result.content[0].text).toContain('没有成员页面');
  });

  it('有更多成员时应显示分页游标', async () => {
    const deps = mockDeps({
      wikiClient: {
        getCategoryMembers: vi.fn().mockResolvedValue({
          members: [
            { title: 'Page1', page_id: 1, ns: 0 },
          ],
          has_more: true,
          continue_cursor: '{"cmcontinue":"page|xxx","continue":"-||"}',
        }),
      },
    });

    const result = await categoryMembers(deps, { category: 'BigCategory' });
    expect(result.content[0].text).toContain('还有更多');
    expect(result.content[0].text).toContain('续传游标');
  });

  it('应传递 limit 和 offset 参数', async () => {
    const mockGetMembers = vi.fn().mockResolvedValue({
      members: [{ title: 'Page1', page_id: 1, ns: 0 }],
      has_more: false,
    });
    const deps = mockDeps({ wikiClient: { getCategoryMembers: mockGetMembers } });

    await categoryMembers(deps, { category: 'TestCategory', limit: 10, offset: '{"cmcontinue":"abc"}' });
    expect(mockGetMembers).toHaveBeenCalledWith('TestCategory', 10, '{"cmcontinue":"abc"}');
  });
});
