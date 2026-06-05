import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AccountSettings } from '@/components/settings/account-settings';
import { db } from '@/lib/db';

// Server Component：在服务端查数据库，然后把数据传给 Client Component
// 行业常用模式：数据获取在 Server Component，交互逻辑在 Client Component
export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');

  // 类型断言：NextAuth session 的 user.id 需要手动声明类型
  const userId = (session.user as { id: string }).id;

  // 只查需要的字段（select），不拉整张表——数据库查询最佳实践
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, image: true, createdAt: true },
  });

  if (!user) redirect('/login');

  return (
    <DashboardLayout>
      <div className="max-w-lg space-y-6">
        <div>
          <h1 className="text-2xl font-bold">账号设置</h1>
          <p className="text-zinc-400 text-sm mt-1">管理你的账号和数据</p>
        </div>
        {/* createdAt 是 Date 对象，转成 ISO 字符串再传给 Client Component */}
        {/* 原因：Server/Client 边界不能传 Date 对象，只能传 JSON 序列化的值 */}
        <AccountSettings user={{ ...user, createdAt: user.createdAt.toISOString() }} />
      </div>
    </DashboardLayout>
  );
}
