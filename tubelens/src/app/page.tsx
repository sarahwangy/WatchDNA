import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { redirect } from 'next/navigation';

// 这是首页（Landing Page）
// 行业常用模式：Server Component 直接做登录检查，已登录就跳转
export default async function HomePage() {
  // 已登录用户直接跳转 dashboard
  const session = await getServerSession(authOptions);
  if (session?.user) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-zinc-950/80 backdrop-blur border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <span className="text-red-500">●</span>
          <span className="font-bold text-lg">Tubelens</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/login"
            className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero 区域：第一屏，吸引用户注意力 */}
      <section className="pt-32 pb-20 px-8 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full text-xs text-zinc-400 mb-8">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          基于 Google Takeout 数据分析
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          You watch differently
          <br />
          <span className="text-red-500">than you think you do.</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          上传你的 Google Takeout 数据，Tubelens 帮你看清真实的 YouTube
          习惯——订阅了什么、真正在看什么、AI 为你生成个人画像。
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            上传我的数据 →
          </Link>
          <a
            href="https://takeout.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white text-sm underline transition-colors"
          >
            如何导出 Takeout？
          </a>
        </div>
      </section>

      {/* 功能亮点：三列卡片，介绍核心特性 */}
      <section className="py-20 px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: '📊',
              title: '订阅 vs 实际观看',
              desc: '847 个订阅，但 80% 时间只花在 23 个频道上——看清你真正的偏好',
            },
            {
              icon: '🕐',
              title: '观看时段热力图',
              desc: '你是深夜型还是早鸟型？24h×7d 热力图揭露你的真实习惯',
            },
            {
              icon: '🤖',
              title: 'AI 个人画像',
              desc: 'Claude AI 基于你的全量数据，生成专属的 YouTube 观看者画像',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition-colors"
            >
              <div className="text-3xl mb-4">{item.icon}</div>
              <h3 className="font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 工作原理：步骤说明 */}
      <section className="py-20 px-8 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-12">三步开始分析</h2>
        <div className="space-y-6">
          {[
            {
              step: '01',
              title: '导出 Google Takeout',
              desc: '去 takeout.google.com，选择 YouTube 数据导出为 zip',
            },
            {
              step: '02',
              title: '上传到 Tubelens',
              desc: '把下载的 zip 文件拖拽上传，系统自动解析（1-3分钟）',
            },
            {
              step: '03',
              title: '查看你的报告',
              desc: 'Dashboard 展示热力图、排行榜，AI 生成个人画像',
            },
          ].map((item) => (
            <div key={item.step} className="flex gap-6 items-start">
              <div className="text-red-500 font-mono text-2xl font-bold w-12 shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-zinc-400 text-sm">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 隐私承诺 */}
      <section className="py-12 px-8 max-w-2xl mx-auto text-center">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <span className="text-green-400 text-2xl">🔒</span>
          <h3 className="font-semibold text-white mt-3 mb-2">你的数据只属于你</h3>
          <p className="text-zinc-400 text-sm">
            数据存储在你的账号下，不会与任何第三方共享。支持一键删除所有数据。
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>
          Tubelens · 由 Next.js + Claude AI 构建 ·{' '}
          <a
            href="https://github.com/sarahwangy/WatchDNA"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </p>
      </footer>
    </main>
  );
}
