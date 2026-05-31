import type { ToolDependencies } from './register.js';
import type { ParseInput } from '../types.js';

export async function parse(deps: ToolDependencies, args: ParseInput) {
  const wikiClient = deps.wikiClientManager.getClient(args.site);

  // Determine mode
  const mode = args.page ? 'page' : 'text';
  const modeLabel = mode === 'text' ? '📝 文本预览（纯渲染，不保存页面）' : `📄 页面解析: ${args.page}`;
  const titleContext = args.title && !args.page ? ` (上下文标题: ${args.title})` : '';

  const result = await wikiClient.parseWikitext(args.page, args.text, args.title);

  const parts: string[] = [
    `## 解析结果: ${modeLabel}${titleContext}`,
    '',
  ];

  // Display title
  if (result.displaytitle && result.displaytitle !== (args.page || args.title)) {
    parts.push(`**显示标题**: ${result.displaytitle}`);
    parts.push('');
  }

  // Categories
  if (result.categories.length > 0) {
    parts.push(`### 📂 分类 (${result.categories.length})`);
    for (const cat of result.categories) {
      parts.push(`- ${cat}`);
    }
  } else {
    parts.push('### 📂 分类: 无');
  }
  parts.push('');

  // Templates used
  if (result.templates.length > 0) {
    parts.push(`### 📋 使用的模板 (${result.templates.length})`);
    for (const tmpl of result.templates) {
      parts.push(`- ${tmpl}`);
    }
  } else {
    parts.push('### 📋 使用的模板: 无');
  }
  parts.push('');

  // Images used
  if (result.images.length > 0) {
    parts.push(`### 🖼️ 使用的图片 (${result.images.length})`);
    for (const img of result.images) {
      parts.push(`- ${img}`);
    }
  }
  parts.push('');

  // Resource modules
  if (result.modules.length > 0) {
    parts.push(`### 📦 加载的模块 (${result.modules.length})`);
    for (const mod of result.modules) {
      parts.push(`- ${mod}`);
    }
    parts.push('');
  }

  // Warnings (non-fatal)
  if (result.parsewarnings.length > 0) {
    parts.push(`### ⚠️ 解析警告 (${result.parsewarnings.length})`);
    for (const w of result.parsewarnings) {
      parts.push(`- ${w}`);
    }
    parts.push('');
  }

  // Errors (fatal / critical)
  if (result.errors.length > 0) {
    parts.push(`### ❌ 解析错误 (${result.errors.length})`);
    for (const err of result.errors) {
      parts.push(`- **[${err.type}]** ${err.message}`);
      if (err.context && err.context.length < 200) {
        parts.push(`  \`\`\`\n  ${err.context}\n  \`\`\``);
      }
    }
    parts.push('');
  } else if (result.parsewarnings.length === 0) {
    parts.push('✅ 未检测到解析错误或警告');
    parts.push('');
  }

  // HTML preview (text-only extract for readability)
  const textContent = result.html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

  const excerpt = textContent.length > 1500
    ? textContent.substring(0, 1500) + '…'
    : textContent;

  if (excerpt) {
    parts.push(`### 📖 渲染内容预览`);
    parts.push('');
    parts.push(excerpt);
  }

  return {
    content: [{ type: 'text', text: parts.join('\n') }],
  };
}
