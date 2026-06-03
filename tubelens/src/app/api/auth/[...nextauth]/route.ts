// [...nextauth] 是 Next.js 的"catch-all 路由"
// 意思是 /api/auth/任何路径 都由这个文件处理
// NextAuth 用它来处理：/callback/google、/signout、/session 等所有认证路径
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  // PrismaAdapter 让 NextAuth 把用户、session 存到我们的数据库
  // 而不是默认的内存存储（重启就丢失）
  adapter: PrismaAdapter(db) as any,
  providers: [
    GoogleProvider({
      // 注意：我们的 .env.local 用的是 AUTH_GOOGLE_ID，不是 GOOGLE_CLIENT_ID
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    // session callback：把数据库里的 userId 注入到前端可访问的 session 对象
    // 这样任何页面都能通过 useSession() 或 getServerSession() 拿到当前用户的 ID
    session({ session, user }) {
      if (session.user && user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // 未登录时跳转到我们自定义的登录页，而不是 NextAuth 默认的丑页面
  },
};

const handler = NextAuth(authOptions);

// Next.js App Router 要求导出 GET 和 POST
// GET：获取 session 信息；POST：处理登录/登出动作
export { handler as GET, handler as POST };
