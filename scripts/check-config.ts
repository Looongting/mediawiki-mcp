#!/usr/bin/env tsx
/**
 * 配置连通性检查工具
 * 验证配置文件是否正确并能连接到 MediaWiki API。
 *
 * 用法: npx tsx scripts/check-config.ts
 */

import { loadConfig } from '../src/config.js';
import { WikiClientManager } from '../src/wiki/client-manager.js';

async function main() {
  console.log('=== MediaWiki MCP - 配置检查 ===\n');

  // 第一步：加载配置
  console.log('1️⃣  加载配置...');
  const config = await loadConfig();
  const siteNames = Object.keys(config.sites);
  console.log(`   ✅ 默认站点: ${config.default_site}`);
  console.log(`   ✅ 已配置站点: ${siteNames.join(', ')}`);

  for (const siteName of siteNames) {
    const site = config.sites[siteName];
    console.log(`\n📌 站点: ${siteName}`);
    console.log(`   URL: ${site.url}`);
    console.log(`   API: ${site.api}`);
    console.log(`   认证方式: ${site.auth.type}`);

    // 第二步：测试 API 连通性
    console.log(`\n2️⃣  测试 ${siteName} API 连通性...`);
    try {
      const resp = await fetch(`${site.api}?action=query&meta=siteinfo&format=json`, {
        method: 'GET',
        headers: {
          'User-Agent': 'MediaWiki-MCP-Check/1.0',
        },
      });
      const data = await resp.json() as any;
      if (data?.query?.general?.sitename) {
        console.log(`   ✅ 已连接: ${data.query.general.sitename}`);
        console.log(`   ✅ MW 版本: ${data.query.general.generator || '未知'}`);
      } else {
        console.log('   ⚠️  API 响应正常但无法解析站点信息');
      }
    } catch (err) {
      console.error(`   ❌ API 连接失败: ${(err as Error).message}`);
      process.exit(1);
    }

    // 第三步：测试认证
    console.log(`\n3️⃣  测试 ${siteName} 认证...`);
    try {
      const manager = new WikiClientManager(config);
      const client = manager.getClient(siteName);
      await client.ensureAuthenticated();
      console.log('   ✅ 认证成功');
    } catch (err) {
      console.error(`   ❌ 认证失败: ${(err as Error).message}`);
      process.exit(1);
    }
  }

  // 第四步：检查 Playwright
  console.log('\n4️⃣  检查 Playwright...');
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    console.log('   ✅ Playwright/Chromium 可用');
  } catch (err) {
    console.warn(`   ⚠️  Playwright 不可用: ${(err as Error).message}`);
    console.warn('   运行 npx playwright install chromium 安装');
  }

  console.log('\n=== ✅ 配置检查通过！ ===');
}

main().catch((err) => {
  console.error(`\n❌ 运行错误: ${err.message}`);
  process.exit(1);
});
