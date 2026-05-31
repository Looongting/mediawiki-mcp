import { describe, it, expect, vi } from 'vitest';
import { parse } from '../../src/tools/parse-tool.js';
import { mockDeps } from '../helpers.js';

function makeParseResult(overrides: Record<string, any> = {}) {
  return {
    html: '<p>rendered content</p>',
    displaytitle: undefined,
    categories: [],
    modules: [],
    templates: [],
    images: [],
    parsewarnings: [],
    errors: [],
    ...overrides,
  };
}

describe('wiki_parse 工具', () => {
  it('page 模式应显示页面标题', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult()),
      },
    });
    const result = await parse(deps, { page: 'TestPage' });

    const text = result.content[0].text;
    expect(text).toContain('页面解析');
    expect(text).toContain('TestPage');
  });

  it('text 模式应标注为纯渲染预览', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult()),
      },
    });
    const result = await parse(deps, { text: 'hello world' });

    const text = result.content[0].text;
    expect(text).toContain('文本预览');
    expect(text).toContain('不保存页面');
  });

  it('应显示分类信息', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult({
          categories: ['Category:Test', 'Category:Example'],
        })),
      },
    });
    const result = await parse(deps, { page: 'TestPage' });

    expect(result.content[0].text).toContain('Category:Test');
    expect(result.content[0].text).toContain('Category:Example');
    expect(result.content[0].text).toContain('📂');
  });

  it('应显示使用的模板', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult({
          templates: ['Template:Infobox', 'Template:Navbox'],
        })),
      },
    });
    const result = await parse(deps, { page: 'TestPage' });

    expect(result.content[0].text).toContain('Template:Infobox');
    expect(result.content[0].text).toContain('Template:Navbox');
    expect(result.content[0].text).toContain('📋');
  });

  it('应显示使用的图片', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult({
          images: ['File:Logo.png', 'File:Banner.jpg'],
        })),
      },
    });
    const result = await parse(deps, { page: 'TestPage' });

    expect(result.content[0].text).toContain('File:Logo.png');
    expect(result.content[0].text).toContain('File:Banner.jpg');
    expect(result.content[0].text).toContain('🖼️');
  });

  it('应显示解析警告', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult({
          parsewarnings: ['Template loop detected', 'Deprecated parameter'],
        })),
      },
    });
    const result = await parse(deps, { page: 'TestPage' });

    expect(result.content[0].text).toContain('Template loop detected');
    expect(result.content[0].text).toContain('Deprecated parameter');
    expect(result.content[0].text).toContain('⚠️');
  });

  it('解析出错时应报告错误', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult({
          html: '<div class="error">missing param</div>',
          errors: [{ type: 'template', severity: 'error', message: 'Template error: missing param', context: '', selector: 'strong.error' }],
        })),
      },
    });

    const result = await parse(deps, { text: '{{Broken}}' });
    expect(result.content[0].text).toContain('template');
    expect(result.content[0].text).toContain('missing param');
    expect(result.content[0].text).toContain('❌');
  });

  it('无错误或警告时应显示绿色标记', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult()),
      },
    });
    const result = await parse(deps, { page: 'CleanPage' });

    expect(result.content[0].text).toContain('未检测到解析错误或警告');
  });

  it('应包含渲染内容文本预览', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult({
          html: '<div><p>Hello <b>World</b></p><p>This is a test paragraph.</p></div>',
        })),
      },
    });
    const result = await parse(deps, { page: 'TestPage' });

    expect(result.content[0].text).toContain('Hello World');
    expect(result.content[0].text).toContain('📖');
    expect(result.content[0].text).toContain('渲染内容预览');
  });

  it('text 模式带 title 参数时应传递上下文标题', async () => {
    const mockParse = vi.fn().mockResolvedValue(makeParseResult());
    const deps = mockDeps({
      wikiClient: { parseWikitext: mockParse },
    });

    await parse(deps, {
      text: '[[Link]] {{Template|param=val}}',
      title: 'ContextPage',
    });

    expect(mockParse).toHaveBeenCalledWith(undefined, '[[Link]] {{Template|param=val}}', 'ContextPage');
    // 输出应包含上下文标题
  });

  it('displaytitle 不同时应显示', async () => {
    const deps = mockDeps({
      wikiClient: {
        parseWikitext: vi.fn().mockResolvedValue(makeParseResult({
          displaytitle: 'Displayed Title',
        })),
      },
    });
    const result = await parse(deps, { page: 'ActualPageTitle' });

    expect(result.content[0].text).toContain('显示标题');
    expect(result.content[0].text).toContain('Displayed Title');
  });
});
