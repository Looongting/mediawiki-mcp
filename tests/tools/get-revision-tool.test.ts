import { describe, it, expect, vi } from 'vitest';
import { getRevision } from '../../src/tools/get-revision-tool.js';
import { mockDeps } from '../helpers.js';

describe('wiki_get_revision 工具', () => {
  it('存在时应返回修订详情', async () => {
    const deps = mockDeps({
      wikiClient: {
        getRevision: vi.fn().mockResolvedValue({
          revision: 100,
          page_title: 'TestPage',
          content: 'revision content',
          timestamp: '2026-05-31T12:00:00Z',
          user: 'TestUser',
          comment: 'edit summary',
          minor: false,
        }),
      },
    });

    const result = await getRevision(deps, { revision: 100 });
    expect(result.content[0].text).toContain('r100');
    expect(result.content[0].text).toContain('TestPage');
    expect(result.content[0].text).toContain('revision content');
    expect(result.content[0].text).toContain('TestUser');
    expect(result.content[0].text).toContain('edit summary');
  });

  it('不存在的修订应抛出错误', async () => {
    const deps = mockDeps({
      wikiClient: {
        getRevision: vi.fn().mockRejectedValue(new Error('Revision 999 not found')),
      },
    });

    await expect(getRevision(deps, { revision: 999 })).rejects.toThrow('Revision 999 not found');
  });
});
