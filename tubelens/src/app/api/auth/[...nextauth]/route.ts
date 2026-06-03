// route.ts 只负责把 HTTP 请求交给 NextAuth 处理
// authOptions 的配置已移到 src/lib/auth-options.ts
// Next.js 14 App Router 规定：route 文件只允许导出 HTTP 方法（GET/POST 等）
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth-options';

const handler = NextAuth(authOptions);

// GET：获取 session 信息；POST：处理登录/登出动作
export { handler as GET, handler as POST };
