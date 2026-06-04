// Prisma v7 使用 WebAssembly 引擎，需要通过 adapter 连接数据库
// 这是 Prisma v7 的标准写法，相比 v6 多了 adapter 这一层
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// 单例模式：防止 Next.js 热重载时创建多个数据库连接
const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // PrismaPg adapter 负责把 Prisma 的 SQL 发给 PostgreSQL
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
