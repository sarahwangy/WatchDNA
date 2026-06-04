// ============================================================
// YouTube Data API v3 封装层
// 职责：给定频道 ID 列表，返回频道的元数据
// API 硬限制：channels.list 单次最多查 50 个频道，所以要分批
// ============================================================

// 定义从 YouTube API 拿回来的频道数据结构
// 这是"数据传输对象"（DTO）——行业常用模式，让调用方知道能拿到什么字段
export interface ChannelData {
  id: string;
  title: string;
  description: string | null;
  country: string | null; // 频道所在国家代码，如 "US" "JP"
  customUrl: string | null; // 频道自定义 URL，如 "@PewDiePie"
  thumbnailUrl: string | null;
  subscriberCount: number | null; // YouTube 可能对外隐藏订阅数
  videoCount: number | null;
  viewCount: number | null;
  publishedAt: Date | null; // 频道创建时间
  topicCategories: string[]; // YouTube 官方分类 URL 列表
}

// 主函数：批量获取频道数据
// channelIds 可以是任意长度，内部自动分批处理
export async function fetchChannels(channelIds: string[]): Promise<ChannelData[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('YOUTUBE_API_KEY not configured');

  const results: ChannelData[] = [];

  // 分批：每次取 50 个（YouTube API 硬限制）
  for (let i = 0; i < channelIds.length; i += 50) {
    const batch = channelIds.slice(i, i + 50);

    // 构建查询参数
    // part 参数决定返回哪些字段组（每个 part 都会消耗一定的 API 配额）
    const params = new URLSearchParams({
      part: 'snippet,statistics,topicDetails',
      id: batch.join(','),
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);

    // 非 2xx 响应直接抛错，让调用方决定怎么处理
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube API ${res.status}: ${err}`);
    }

    const data = await res.json();

    // 把 YouTube 返回的原始格式映射成我们定义的 ChannelData 结构
    // ?? null 是空值合并运算符：左边是 undefined/null 时返回右边
    for (const item of data.items || []) {
      results.push({
        id: item.id,
        title: item.snippet?.title ?? '',
        description: item.snippet?.description ?? null,
        country: item.snippet?.country ?? null,
        customUrl: item.snippet?.customUrl ?? null,
        thumbnailUrl: item.snippet?.thumbnails?.default?.url ?? null,
        // YouTube API 返回的数字是字符串格式，需要 parseInt 转换
        subscriberCount: item.statistics?.subscriberCount
          ? parseInt(item.statistics.subscriberCount)
          : null,
        videoCount: item.statistics?.videoCount ? parseInt(item.statistics.videoCount) : null,
        viewCount: item.statistics?.viewCount ? parseInt(item.statistics.viewCount) : null,
        publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : null,
        topicCategories: item.topicDetails?.topicCategories ?? [],
      });
    }

    // 批次间隔 100ms，防止短时间内发太多请求触发速率限制
    // 行业常用模式：rate limiting / backoff
    if (i + 50 < channelIds.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return results;
}
