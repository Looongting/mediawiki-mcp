import { describe, it, expect, vi } from 'vitest';
import { deletePage } from '../../src/tools/delete-page-tool.js';
import { undeletePage } from '../../src/tools/undelete-page-tool.js';
import { mockDeps } from '../helpers.js';

describe('wiki_delete_page 工具', () => {
  it('未确认时应返回安全警告', async () => {
    const deps = mockDeps({});

    const result = await deletePage(deps, { page: 'TestPage', confirm: false });
    expect(result.content[0].text).toContain('⚠️');
    expect(result.content[0].text).toContain('confirm: true');
  });

  it('confirm 未设置时应返回安全警告', async () => {
    const deps = mockDeps({});

    const result = await deletePage(deps, { page: 'TestPage', confirm: false });
    expect(result.content[0].text).toContain('⚠️');
  });

  it('确认后应执行删除', async () => {
    const deps = mockDeps({
      wikiClient: {
        deletePage: vi.fn().mockResolvedValue({ success: true, message: '页面 "TestPage" 已删除。' }),
      },
    });

    const result = await deletePage(deps, { page: 'TestPage', confirm: true, reason: 'test' });
    expect(result.content[0].text).toContain('已删除');
  });
});

describe('wiki_undelete_page 工具', () => {
  it('未确认时应返回安全警告', async () => {
    const deps = mockDeps({});

    const result = await undeletePage(deps, { page: 'TestPage', confirm: false });
    expect(result.content[0].text).toContain('⚠️');
  });

  it('确认后应执行恢复', async () => {
    const deps = mockDeps({
      wikiClient: {
        undeletePage: vi.fn().mockResolvedValue({ success: true, message: '页面 "TestPage" 已恢复。' }),
      },
    });

    const result = await undeletePage(deps, { page: 'TestPage', confirm: true });
    expect(result.content[0].text).toContain('已恢复');
  });
});
