// middleware.ts 在每次 HTTP 请求之前执行
// 就像"门卫"：检查用户是否登录，没登录就踢回 /login
// Next.js 中间件运行在 Edge Runtime，比普通 API 快得多
export { default } from 'next-auth/middleware';

export const config = {
  // matcher 定义哪些路径需要登录才能访问
  // 注意：/, /login, /demo, /api/auth/* 不在列表里，所以它们是公开的
  matcher: [
    '/dashboard/:path*',
    '/subscriptions/:path*',
    '/watching/:path*',
    '/insights/:path*',
    '/import/:path*',
    '/settings/:path*',
    '/search/:path*',
  ],
};
