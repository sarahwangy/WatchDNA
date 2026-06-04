// 解析 watch-history.html 的 DOM 结构
// 每条观看记录是一个 .content-cell div，包含：视频链接、频道链接、时间文字
import * as cheerio from 'cheerio';
import { db } from '@/lib/db';

// 从 YouTube 视频 URL 提取 videoId，例：?v=dQw4w9WgXcQ → dQw4w9WgXcQ
function extractVideoId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

// 从频道 URL 提取 channelId，例：/channel/UCxxxxxx → UCxxxxxx
function extractChannelId(url: string): string | null {
  const match = url.match(/channel\/(UC[^/?]+)/);
  return match ? match[1] : null;
}

// 把 Google Takeout 里的时间字符串转成 Date 对象
function parseWatchTime(text: string): Date | null {
  const cleaned = text.trim().replace(/\s+/g, ' ');
  const date = new Date(cleaned);
  // new Date() 失败时返回 Invalid Date，用 isNaN 检测
  return isNaN(date.getTime()) ? null : date;
}

export async function parseWatchHistory(html: string, userId: string): Promise<number> {
  // cheerio：在 Node.js 里用 jQuery 风格操作 HTML DOM（行业常用服务端 HTML 解析方案）
  const $ = cheerio.load(html);

  const entries: Array<{
    videoId: string | null;
    videoTitle: string;
    channelId: string | null;
    channelTitle: string | null;
    watchedAt: Date;
  }> = [];

  // Google Takeout HTML 里每条记录对应一个 .content-cell 元素
  $('.content-cell').each((_, el) => {
    const cell = $(el);
    const links = cell.find('a');
    if (links.length === 0) return; // 没有链接的 cell 不是视频记录

    // 第一个链接 = 视频链接，第二个链接 = 频道链接
    const videoLink = links.eq(0);
    const videoUrl = videoLink.attr('href') || '';
    const videoTitle = videoLink.text().trim();

    // 过滤掉非视频链接（广告记录、已删除视频占位等）
    if (!videoUrl.includes('youtube.com/watch') && !videoUrl.includes('youtu.be')) return;
    if (!videoTitle) return;

    const channelLink = links.eq(1);
    const channelUrl = channelLink.attr('href') || '';

    // 时间戳在 cell 文本的最后一行（Takeout 固定格式）
    const lines = cell
      .text()
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const lastLine = lines.at(-1) || '';
    const watchedAt = parseWatchTime(lastLine) || new Date();

    entries.push({
      videoId: extractVideoId(videoUrl),
      videoTitle,
      channelId: extractChannelId(channelUrl),
      channelTitle: channelLink.text().trim() || null,
      watchedAt,
    });
  });

  // 分批写入，每批 500 条（createMany 比逐条 insert 快很多）
  for (let i = 0; i < entries.length; i += 500) {
    const batch = entries.slice(i, i + 500);

    // 先确保涉及的频道存在于 Channel 表（外键约束要求）
    const channelsToCreate = batch.filter((e) => e.channelId && e.channelTitle);
    if (channelsToCreate.length > 0) {
      await db.$transaction(
        channelsToCreate.map((e) =>
          db.channel.upsert({
            where: { id: e.channelId! },
            update: {}, // 频道已存在就不改，避免覆盖更精确的数据
            create: { id: e.channelId!, title: e.channelTitle! },
          })
        )
      );
    }

    // createMany + skipDuplicates：批量插入，跳过主键冲突（行业常用导入模式）
    await db.watchEvent.createMany({
      data: batch.map((e) => ({
        userId,
        videoId: null, // videoId 字段留给后续视频详情 API 填充
        channelId: e.channelId,
        videoTitle: e.videoTitle,
        watchedAt: e.watchedAt,
      })),
      skipDuplicates: true,
    });
  }

  return entries.length;
}
