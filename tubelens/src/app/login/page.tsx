// 这是服务端组件（没有 'use client'）
// getServerSession 在服务端检查登录状态，比客户端 useSession 更快
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { LoginButton } from '@/components/auth/login-button';

export default async function LoginPage() {
  // 已登录的用户直接跳转，不需要再看登录页
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Tubelens</h1>
          <p className="text-sm text-muted-foreground">深入了解你的 YouTube 习惯</p>
        </div>
        <LoginButton />
        <p className="text-center text-xs text-muted-foreground">
          你的数据保持私密。我们只读取你的 Takeout 导出文件。
        </p>
      </div>
    </main>
  );
}
