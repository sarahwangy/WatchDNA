// 用 Claude Haiku 给频道分配分类和标签
// 每次发送 10 个频道，一次 prompt 批量处理，节省 token
import { askClaude } from '@/lib/claude';
import { db } from '@/lib/db';

const VALID_CATEGORIES = [
  'Tech',
  'Music',
  'Gaming',
  'Education',
  'News',
  'Entertainment',
  'Lifestyle',
  'Sports',
  'Science',
  'Art',
  'Other',
];

interface ChannelToClassify {
  id: string;
  title: string;
  description: string | null;
}

interface ClassifyResult {
  channelId: string;
  category: string;
  tags: string[];
}

export async function classifyChannels(channels: ChannelToClassify[]): Promise<ClassifyResult[]> {
  if (channels.length === 0) return [];

  // 把频道列表格式化成可读文本，description 截断到 100 字符避免 prompt 太长
  const channelList = channels
    .map(
      (c, i) =>
        `${i + 1}. Title: "${c.title}" | Description: "${(c.description || '').slice(0, 100)}"`
    )
    .join('\n');

  const prompt = `Classify these YouTube channels. For each channel, provide:
1. One main category (must be exactly one of: ${VALID_CATEGORIES.join(', ')})
2. 3-5 tags (lowercase, comma-separated)

Channels:
${channelList}

Respond in JSON format only, no explanation:
[{"index": 1, "category": "Tech", "tags": ["programming", "tutorials"]}, ...]`;

  const response = await askClaude(prompt);

  // 用正则匹配 JSON 数组，防止 Claude 在 JSON 前后加了说明文字
  const jsonMatch = response.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid AI response format');

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    index: number;
    category: string;
    tags: string[];
  }>;

  return parsed
    .map((item) => {
      const channel = channels[item.index - 1];
      if (!channel) return null;
      // 如果 AI 返回的分类不在白名单里，降级到 Other
      const category = VALID_CATEGORIES.includes(item.category) ? item.category : 'Other';
      return {
        channelId: channel.id,
        category,
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : [],
      };
    })
    .filter((r): r is ClassifyResult => r !== null);
}

export async function classifyUserChannels(userId: string): Promise<number> {
  // 只查还没有 AI 分类的频道，避免重复计费
  const channels = await db.channel.findMany({
    where: {
      subscriptions: { some: { userId } },
      aiCategory: null,
      title: { not: '' },
    },
    select: { id: true, title: true, description: true },
    take: 100,
  });

  if (channels.length === 0) return 0;

  let classified = 0;
  // 每批 10 个，减少单次 prompt 长度，也降低一次失败的损失
  for (let i = 0; i < channels.length; i += 10) {
    const batch = channels.slice(i, i + 10);
    try {
      const results = await classifyChannels(batch);
      // $transaction 保证批次内要么全部写入，要么全部回滚
      await db.$transaction(
        results.map((r) =>
          db.channel.update({
            where: { id: r.channelId },
            data: { aiCategory: r.category, aiTags: r.tags },
          })
        )
      );
      classified += results.length;
    } catch (err) {
      console.error('Classification batch failed:', err);
    }
  }

  return classified;
}
