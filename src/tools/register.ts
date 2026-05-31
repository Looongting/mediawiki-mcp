import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { AppConfig } from '../types.js';
import type { WikiClientManager } from '../wiki/client-manager.js';
import type { BrowserManager } from '../browser/manager.js';

export interface ToolDependencies {
  wikiClientManager: WikiClientManager;
  browserManager: BrowserManager;
  config: AppConfig;
}

export function registerTools(server: Server, deps: ToolDependencies): void {
  // Tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'wiki_read',
        description: '读取 MediaWiki 页面的原始 Wikitext 内容。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题' },
            section: { type: 'number', description: '章节编号（可选）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page'],
        },
      },
      {
        name: 'wiki_edit',
        description: '创建或更新 MediaWiki 页面。支持两种模式：（1）content 全页替换；（2）old_string + new_string 查找替换。支持 dry_run（仅预览差异不保存）和 sandbox（发布到沙箱页面）模式。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题' },
            content: { type: 'string', description: '新的 Wikitext 内容（全页替换模式）。如果提供此参数，则忽略 old_string/new_string' },
            old_string: { type: 'string', description: '要在页面中查找的文本（查找替换模式，与 new_string 配合使用）' },
            new_string: { type: 'string', description: '替换后的文本（查找替换模式，与 old_string 配合使用）' },
            replace_all: { type: 'boolean', description: '替换所有匹配项（默认 false，仅替换首个匹配）' },
            summary: { type: 'string', description: '编辑摘要' },
            minor: { type: 'boolean', description: '标记为小编辑' },
            bot: { type: 'boolean', description: '标记为机器人编辑（默认 true）' },
            dry_run: { type: 'boolean', description: '仅预览差异，不保存' },
            sandbox: { type: 'boolean', description: '发布到沙箱页面而非真实页面' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page'],
        },
      },
      {
        name: 'wiki_parse',
        description: '将 Wikitext 解析为渲染后的 HTML（服务器端），检测模板/SMW/解析器错误和警告。支持两种模式：（1）text — 纯渲染不保存，预览任意 Wikitext 的渲染结果；（2）page — 解析已有页面的当前版本。返回分类、模板使用、图片引用、模块加载、解析警告和错误等详细信息。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题（解析已有页面的当前版本）' },
            text: { type: 'string', description: '原始 Wikitext 文本（纯渲染预览，不保存页面）' },
            title: { type: 'string', description: 'text 模式下使用的虚拟页面标题（帮助解析器正确处理相对链接和模板参数）' },
            mobile: { type: 'boolean', description: '移动端视图' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
        },
      },
      {
        name: 'wiki_validate',
        description: '完整页面验证：服务端解析 + 浏览器渲染 + 错误检测 + 截图。返回结构化错误报告。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '要验证的页面标题' },
            text: { type: 'string', description: '可选，验证原始文本而非页面内容' },
            screenshot: { type: 'boolean', description: '是否截图（默认 true）' },
            browser: { type: 'boolean', description: '是否使用浏览器检测（默认 true）' },
            rules: { type: 'array', items: { type: 'string' }, description: '要应用的检测规则名称' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
        },
      },
      {
        name: 'wiki_browser_capture',
        description: '使用浏览器打开页面，捕获控制台日志、网络错误和截图。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面完整 URL 或页面标题' },
            wait_ms: { type: 'number', description: '加载后等待时间（毫秒，默认 3000）' },
            screenshot: { type: 'boolean', description: '是否截图（默认 true）' },
            full_page: { type: 'boolean', description: '是否整页截图（默认 true）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page'],
        },
      },
      {
        name: 'wiki_search',
        description: '搜索 MediaWiki 页面。支持 mode 参数切换搜索类型：text（全文搜索，默认）和 prefix（前缀匹配，按页面标题前缀查找）。支持 offset 分页。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: '搜索关键词' },
            mode: { type: 'string', description: '搜索模式: text（全文搜索）或 prefix（前缀匹配）。默认 text' },
            limit: { type: 'number', description: '返回结果数（默认 20，最大 500）' },
            namespace: { type: 'number', description: '命名空间（默认 0）' },
            offset: { type: 'string', description: '分页续传游标（上次返回的 continue_cursor 值）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['query'],
        },
      },
      {
        name: 'wiki_smw_query',
        description: '执行 Semantic MediaWiki 查询。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'SMW 查询字符串，例如 [[Category:Cities]] [[Population::>1000000]]' },
            format: { type: 'string', description: '输出格式（table, list, json, count，默认 table）' },
            limit: { type: 'number', description: '最大结果数（默认 50）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['query'],
        },
      },
      {
        name: 'wiki_diff',
        description: '显示页面当前版本与指定内容的差异。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题' },
            from_revision: { type: 'number', description: '旧修订版本号（默认当前版本）' },
            to_content: { type: 'string', description: '要对比的新内容' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page'],
        },
      },
      {
        name: 'wiki_history',
        description: '获取页面的修订历史。支持 offset 分页。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题' },
            limit: { type: 'number', description: '返回条目数（默认 20）' },
            offset: { type: 'string', description: '分页续传游标（上次返回的 continue_cursor 值）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page'],
        },
      },
      {
        name: 'wiki_revert',
        description: '将页面恢复到指定修订版本。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题' },
            revision: { type: 'number', description: '要恢复到的修订版本号' },
            summary: { type: 'string', description: '恢复原因' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page', 'revision'],
        },
      },
      {
        name: 'wiki_autofix',
        description: '自动修复循环：将内容发布到沙箱 → 执行完整验证 → 返回结构化错误报告和修复建议。AI 根据结果修正内容后再次调用此工具，形成修复闭环。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '目标页面标题' },
            content: { type: 'string', description: '要验证和修复的 Wikitext 内容' },
            iteration: { type: 'number', description: '当前迭代次数（从 1 开始，默认 1）' },
            max_iterations: { type: 'number', description: '最大迭代次数（默认 5）' },
            enable_browser: { type: 'boolean', description: '是否启用浏览器检测（默认 true）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page', 'content'],
        },
      },
      {
        name: 'wiki_batch_read',
        description: '批量读取多个 MediaWiki 页面的原始 Wikitext 内容。使用管道符分隔的 titles 参数进行单次 API 调用，最多可读取 50 个页面。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            pages: { type: 'array', items: { type: 'string' }, description: '页面标题列表' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['pages'],
        },
      },
      {
        name: 'wiki_category_members',
        description: '列出指定分类下的所有成员页面。自动补全 Category: 前缀。支持 cmcontinue 游标分页。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            category: { type: 'string', description: '分类名称（自动补全 Category: 前缀）' },
            limit: { type: 'number', description: '返回成员数（默认 50，最大 500）' },
            offset: { type: 'string', description: '分页续传游标（上次返回的 continue_cursor 值）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['category'],
        },
      },
      {
        name: 'wiki_get_revision',
        description: '获取指定修订版本的详细信息（内容、用户、时间、摘要）。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题（可选，用于交叉验证）' },
            revision: { type: 'number', description: '修订版本号' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['revision'],
        },
      },
      {
        name: 'wiki_recent_changes',
        description: '获取全站最近更改列表。支持按用户、命名空间、类型过滤和分页。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: '返回条目数（默认 20，最大 500）' },
            namespace: { type: 'number', description: '按命名空间过滤' },
            user: { type: 'string', description: '按用户名过滤' },
            type: { type: 'string', description: '按更改类型过滤: edit, new, log, categorize, external' },
            offset: { type: 'string', description: '分页续传游标（上次返回的 continue_cursor 值）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
        },
      },
      {
        name: 'wiki_get_file',
        description: '获取已上传文件的信息（URL、大小、尺寸、MIME、上传者等）。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: '文件名（自动补全 File: 前缀）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['filename'],
        },
      },
      {
        name: 'wiki_list_wikis',
        description: '列出所有已配置的 Wiki 站点及其连接状态。默认执行连通性检查（使用 siteinfo API，无需认证），可通过 check: false 跳过检查。',
        inputSchema: {
          type: 'object',
          properties: {
            check: { type: 'boolean', description: '是否检查站点连通性（默认 true）' },
          },
        },
      },
      {
        name: 'wiki_delete_page',
        description: '删除指定页面。⚠️ 破坏性操作：首次调用返回警告，需要再次调用并设置 confirm: true 才会执行删除。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题' },
            reason: { type: 'string', description: '删除原因' },
            confirm: { type: 'boolean', description: '确认执行删除。未设置或 false 时仅返回安全警告，不执行操作。' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page'],
        },
      },
      {
        name: 'wiki_undelete_page',
        description: '恢复已删除的页面。⚠️ 操作需确认：首次调用返回警告，需要再次调用并设置 confirm: true 才会执行恢复。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            page: { type: 'string', description: '页面标题' },
            reason: { type: 'string', description: '恢复原因' },
            confirm: { type: 'boolean', description: '确认执行恢复。未设置或 false 时仅返回安全警告，不执行操作。' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['page'],
        },
      },
      {
        name: 'wiki_upload_file',
        description: '上传文件到 MediaWiki。支持两种模式：（1）file_url — 提供远程 URL，由 MediaWiki 服务器下载；（2）file_path — 提供本地文件路径，以 multipart/form-data 直接上传。使用 site 参数指定目标站点。',
        inputSchema: {
          type: 'object',
          properties: {
            filename: { type: 'string', description: '目标文件名（如 Example.png，自动补全 File: 前缀）' },
            file_url: { type: 'string', description: '远程文件 URL（MediaWiki 服务器下载，与 file_path 二选一）' },
            file_path: { type: 'string', description: '本地文件路径（直接上传，与 file_url 二选一）' },
            comment: { type: 'string', description: '上传摘要/注释' },
            text: { type: 'string', description: '文件描述页面的 Wikitext 内容（可选）' },
            site: { type: 'string', description: '目标站点名称，留空使用默认站点' },
          },
          required: ['filename'],
        },
      },
    ],
  }));

  // Tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'wiki_read': {
          const { read } = await import('./read-tool.js');
          return await read(deps, args as any);
        }
        case 'wiki_edit': {
          const { edit } = await import('./edit-tool.js');
          return await edit(deps, args as any);
        }
        case 'wiki_parse': {
          const { parse } = await import('./parse-tool.js');
          return await parse(deps, args as any);
        }
        case 'wiki_validate': {
          const { validate } = await import('./validate-tool.js');
          return await validate(deps, args as any);
        }
        case 'wiki_browser_capture': {
          const { capture } = await import('./browser-tool.js');
          return await capture(deps, args as any);
        }
        case 'wiki_search': {
          const { search } = await import('./search-tool.js');
          return await search(deps, args as any);
        }
        case 'wiki_smw_query': {
          const { smwQuery } = await import('./smw-tool.js');
          return await smwQuery(deps, args as any);
        }
        case 'wiki_diff': {
          const { diff } = await import('./diff-tool.js');
          return await diff(deps, args as any);
        }
        case 'wiki_history': {
          const { history } = await import('./history-tool.js');
          return await history(deps, args as any);
        }
        case 'wiki_revert': {
          const { revert } = await import('./revert-tool.js');
          return await revert(deps, args as any);
        }
        case 'wiki_autofix': {
          const { autofix } = await import('./autofix-tool.js');
          return await autofix(deps, args as any);
        }
        case 'wiki_batch_read': {
          const { batchRead } = await import('./batch-read-tool.js');
          return await batchRead(deps, args as any);
        }
        case 'wiki_category_members': {
          const { categoryMembers } = await import('./category-members-tool.js');
          return await categoryMembers(deps, args as any);
        }
        case 'wiki_get_revision': {
          const { getRevision } = await import('./get-revision-tool.js');
          return await getRevision(deps, args as any);
        }
        case 'wiki_recent_changes': {
          const { recentChanges } = await import('./recent-changes-tool.js');
          return await recentChanges(deps, args as any);
        }
        case 'wiki_get_file': {
          const { getFile } = await import('./get-file-tool.js');
          return await getFile(deps, args as any);
        }
        case 'wiki_list_wikis': {
          const { listWikis } = await import('./list-wikis-tool.js');
          return await listWikis(deps, args as any);
        }
        case 'wiki_delete_page': {
          const { deletePage } = await import('./delete-page-tool.js');
          return await deletePage(deps, args as any);
        }
        case 'wiki_undelete_page': {
          const { undeletePage } = await import('./undelete-page-tool.js');
          return await undeletePage(deps, args as any);
        }
        case 'wiki_upload_file': {
          const { uploadFile } = await import('./upload-file-tool.js');
          return await uploadFile(deps, args as any);
        }
        default:
          throw new Error(`未知工具: ${name}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text', text: `错误: ${message}` }],
        isError: true,
      };
    }
  });
}
