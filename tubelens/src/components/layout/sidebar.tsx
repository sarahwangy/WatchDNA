'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

// 导航项配置：href = 路由路径，label = 显示名称，icon = emoji 图标
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/subscriptions', label: 'Subscriptions', icon: '📋' },
  { href: '/watching', label: 'Watching', icon: '👁' },
  { href: '/search', label: 'Search', icon: '🔍' },
  { href: '/insights', label: 'AI Insights', icon: '🤖' },
  { href: '/import', label: 'Import Data', icon: '📤' },
  { href: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar() {
  // usePathname：Next.js App Router 的 hook，获取当前 URL 路径（行业常用模式）
  const pathname = usePathname();
  // useSession：next-auth 提供的 hook，读取当前登录用户信息
  const { data: session } = useSession();

  return (
    // fixed + h-screen：固定在屏幕左侧，贯穿全高，不随页面滚动（fixed sidebar 是行业常用布局模式）
    <aside className="fixed left-0 top-0 h-screen w-60 bg-zinc-900 border-r border-zinc-800 flex flex-col z-40">
      {/* Logo 区域 */}
      <div className="px-6 py-5 border-b border-zinc-800">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-red-500 text-lg">●</span>
          <span className="font-bold text-white text-lg">Tubelens</span>
        </Link>
      </div>

      {/* 导航菜单：flex-1 让它占满剩余空间，overflow-y-auto 处理菜单过多时可滚动 */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          // 判断当前路由是否匹配该菜单项（startsWith 处理子路由也高亮的情况）
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                ${
                  isActive
                    ? 'bg-red-500/10 text-red-400 font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 用户信息 + 登出：固定在侧边栏底部 */}
      <div className="px-4 py-4 border-t border-zinc-800">
        {session?.user && (
          <div className="flex items-center gap-3 mb-3">
            {session.user.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="avatar" className="w-7 h-7 rounded-full" />
            )}
            <div className="flex-1 min-w-0">
              {/* truncate：文字超出时显示省略号，防止长名字撑坏布局 */}
              <p className="text-xs text-white truncate">{session.user.name}</p>
              <p className="text-xs text-zinc-500 truncate">{session.user.email}</p>
            </div>
          </div>
        )}
        {/* signOut：next-auth 提供的登出函数，callbackUrl 指定登出后跳转页面 */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-xs text-zinc-500 hover:text-white px-2 py-1 rounded transition-colors"
        >
          Sign out →
        </button>
      </div>
    </aside>
  );
}
