// authOptions 单独放在 lib/ 里，原因：
// Next.js 14 App Router 的 route 文件只能导出 HTTP 方法（GET/POST 等）
// 不能导出其他变量，否则 build 会报错
// 其他文件（login page、dashboard、requireUser）从这里 import authOptions
import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  // PrismaAdapter 让 NextAuth 把用户、session 存到我们的数据库
  // 而不是默认的内存存储（重启就丢失）
  adapter: PrismaAdapter(db) as any,
  debug: false,
  // PrismaAdapter 默认用 database session，但 next-auth/middleware 只认 JWT
  // 所以必须显式指定 jwt，否则 middleware 永远读不到 session → 无限重定向
  session: { strategy: 'jwt' },
  providers: [
    GoogleProvider({
      // 注意：我们的 .env.local 用的是 AUTH_GOOGLE_ID，不是 GOOGLE_CLIENT_ID
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    // jwt strategy 下：用户首次登录时把 userId 存进 token
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    // session callback：从 token 里把 userId 注入 session，供页面使用
    session({ session, token }) {
      if (session.user && token.id) {
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // 未登录时跳转到我们自定义的登录页，而不是 NextAuth 默认的丑页面
  },
};
