'use client';

// 'use client' 表示这是客户端组件，因为需要 useState 和用户交互
// 行业常用模式：表单、按钮交互放在 Client Component，数据获取放在 Server Component

import { useState } from 'react';
import { signOut } from 'next-auth/react';

interface AccountSettingsProps {
  user: {
    email: string | null;
    name: string | null;
    image: string | null;
    createdAt: string; // ISO 字符串，从 Server Component 传入
  };
}

export function AccountSettings({ user }: AccountSettingsProps) {
  // deleting：正在请求删除 API 时为 true，用于禁用按钮防止重复点击
  const [deleting, setDeleting] = useState(false);
  // showConfirm：控制是否显示二次确认按钮
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      // 调用后端 DELETE /api/user/delete
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (res.ok) {
        // 删除成功后退出登录，跳转首页
        await signOut({ callbackUrl: '/' });
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 用户信息卡片 */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">Account Info</h3>
        <div className="flex items-center gap-4 mb-4">
          {user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="avatar" className="w-12 h-12 rounded-full" />
          )}
          <div>
            <p className="font-medium text-white">{user.name || '—'}</p>
            <p className="text-sm text-zinc-400">{user.email}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          Joined {new Date(user.createdAt).toLocaleDateString('en-US')}
        </p>
      </div>

      {/* 危险区：删除账号 */}
      <div className="bg-zinc-900 border border-red-500/20 rounded-xl p-6">
        <h3 className="text-sm font-medium text-red-400 mb-2">Danger Zone</h3>
        <p className="text-zinc-400 text-sm mb-4">
          Deleting your account will permanently erase all your data, including watch history,
          subscription records, and AI insights. This action cannot be undone.
        </p>

        {/* 两步确认：先点"删除账号"，再出现二次确认，防误操作 */}
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-sm text-red-400 border border-red-500/30 px-4 py-2 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-400 font-medium">
              Are you sure you want to delete all your data?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="text-sm bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-sm text-zinc-400 hover:text-white px-4 py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
