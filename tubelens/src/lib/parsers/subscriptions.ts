// 解析 subscriptions.csv，格式：
// Channel Id,Channel Url,Channel Title
// UCxxxxxx,https://www.youtube.com/channel/UCxxxxxx,Fireship
import Papa from 'papaparse';
import { db } from '@/lib/db';

// 行业常用模式：用 interface 描述 CSV 的每一列，让 TypeScript 帮我们检查字段名
interface SubscriptionRow {
  'Channel Id': string;
  'Channel Url': string;
  'Channel Title': string;
}

export async function parseSubscriptions(csvText: string, userId: string): Promise<number> {
  // Papa.parse：行业常用 CSV 解析库，header:true 表示用第一行作为字段名
  const result = Papa.parse<SubscriptionRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  // 只处理有效的 YouTube Channel ID（以 UC 开头），过滤掉空行或格式错误的数据
  const rows = result.data.filter((row) => row['Channel Id']?.startsWith('UC'));
  let count = 0;

  // 分批处理，每批 100 条，避免单个事务太大导致超时或内存溢出
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100);

    // upsert = update + insert：已存在就更新标题，不存在就新建
    // 行业常用模式：导入数据时用 upsert 保证幂等（多次导入结果一样）
    await db.$transaction(
      batch.map((row) =>
        db.channel.upsert({
          where: { id: row['Channel Id'] },
          update: { title: row['Channel Title'] },
          create: { id: row['Channel Id'], title: row['Channel Title'] },
        })
      )
    );

    // 写订阅关系；userId_channelId 是联合唯一键（在 Prisma schema 里定义的）
    await db.$transaction(
      batch.map((row) =>
        db.subscription.upsert({
          where: { userId_channelId: { userId, channelId: row['Channel Id'] } },
          update: {}, // 已存在就不改任何字段
          create: { userId, channelId: row['Channel Id'] },
        })
      )
    );

    count += batch.length;
  }

  // 返回成功处理的行数，调用方可以用来展示进度
  return count;
}
