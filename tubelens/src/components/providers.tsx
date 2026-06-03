'use client';
// 'use client' 声明这是客户端组件
// SessionProvider 需要在浏览器里运行（监听登录状态变化）
// 但我们把它单独隔离在这个文件里
// 这样 layout.tsx 本身仍可以是服务端组件（加载更快）

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
