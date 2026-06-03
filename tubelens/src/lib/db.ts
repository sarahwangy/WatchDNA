// 为什么需要"单例"模式？
// Next.js 开发时会频繁热重载（改代码自动刷新），
// 每次重载都 new PrismaClient() 会创建新连接，最终耗尽数据库连接数。
// 把实例存在 global 对象上，热重载时直接复用已有连接。
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'], // 开发时在终端打印每条 SQL，方便调试
  });

// 只在开发环境缓存到 global，生产环境每次都新建（Vercel 无状态函数）
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
