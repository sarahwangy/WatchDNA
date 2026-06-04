import { Sidebar } from './sidebar';

// DashboardLayout：全局布局组件，所有需要侧边栏的页面都套这个壳
// children 是 React 的通用"插槽"写法——行业里称为"Wrapper/Layout pattern"
export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Sidebar />
      {/* ml-60 = margin-left: 240px，与侧边栏宽度 w-60 对齐，避免内容被遮挡 */}
      <main className="ml-60 min-h-screen p-8">{children}</main>
    </div>
  );
}
