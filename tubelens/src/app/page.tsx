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
          Powered by Google Takeout data
        </div>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          You watch differently
          <br />
          <span className="text-red-500">than you think you do.</span>
        </h1>
        <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
          Upload your Google Takeout data and Tubelens reveals your real YouTube habits — what you
          subscribe to, what you actually watch, and an AI-generated personal profile.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
          >
            Upload My Data →
          </Link>
          <a
            href="https://takeout.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white text-sm underline transition-colors"
          >
            How to export Takeout?
          </a>
        </div>
      </section>

      {/* 功能亮点：三列卡片，介绍核心特性 */}
      <section className="py-20 px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: '📊',
              title: 'Subscriptions vs. Actual Watching',
              desc: '847 subscriptions, but 80% of your time goes to just 23 channels — see your true preferences',
            },
            {
              icon: '🕐',
              title: 'Watch Time Heatmap',
              desc: 'Night owl or early bird? A 24h×7d heatmap reveals your real habits',
            },
            {
              icon: '🤖',
              title: 'AI Personal Profile',
              desc: 'Claude AI generates a personalized YouTube viewer profile from your full data',
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
        <h2 className="text-2xl font-bold text-center mb-12">Get started in 3 steps</h2>
        <div className="space-y-6">
          {[
            {
              step: '01',
              title: 'Export Google Takeout',
              desc: 'Go to takeout.google.com, select YouTube data and export as a zip',
            },
            {
              step: '02',
              title: 'Upload to Tubelens',
              desc: 'Drag and drop the downloaded zip — the system parses it automatically (1–3 min)',
            },
            {
              step: '03',
              title: 'View Your Report',
              desc: 'Dashboard shows heatmaps and rankings, and AI generates your personal profile',
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
          <h3 className="font-semibold text-white mt-3 mb-2">Your data belongs to you</h3>
          <p className="text-zinc-400 text-sm">
            Data is stored under your account and never shared with any third party. You can delete
            everything with one click.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-zinc-900 text-center text-zinc-500 text-sm">
        <p>
          Tubelens · Built with Next.js + Claude AI ·{' '}
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
