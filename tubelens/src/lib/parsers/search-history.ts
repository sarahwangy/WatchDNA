// 解析 search-history.html，结构与 watch-history.html 类似
// 搜索链接格式：https://www.youtube.com/results?search_query=xxx
import * as cheerio from 'cheerio';
import { db } from '@/lib/db';

export async function parseSearchHistory(html: string, userId: string): Promise<number> {
  const $ = cheerio.load(html);
  const entries: Array<{ query: string; searchedAt: Date }> = [];

  // 同样遍历 .content-cell，但这次只关心 search_query 参数
  $('.content-cell').each((_, el) => {
    const cell = $(el);
    const link = cell.find('a').first();
    const href = link.attr('href') || '';

    // 只处理包含搜索关键词的链接
    if (!href.includes('search_query=')) return;

    try {
      // 用 Web 标准 URL API 解析查询参数（比正则更可靠）
      // 新概念：URL 是浏览器/Node.js 内置的 API，不需要安装任何包
      const url = new URL(href);
      const query = url.searchParams.get('search_query');
      if (!query) return;

      // 时间同样在 cell 最后一行
      const lines = cell
        .text()
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const lastLine = lines.at(-1) || '';
      const searchedAt = new Date(lastLine);

      entries.push({
        // decodeURIComponent 把 URL 编码（%E4%B8%AD%E6%96%87）还原成正常文字
        query: decodeURIComponent(query),
        searchedAt: isNaN(searchedAt.getTime()) ? new Date() : searchedAt,
      });
    } catch {
      // 忽略无法解析的 URL，保持程序继续运行
    }
  });

  // 批量写入，每批 500 条
  for (let i = 0; i < entries.length; i += 500) {
    await db.searchEvent.createMany({
      data: entries.slice(i, i + 500).map((e) => ({ userId, ...e })),
      skipDuplicates: true,
    });
  }

  return entries.length;
}
