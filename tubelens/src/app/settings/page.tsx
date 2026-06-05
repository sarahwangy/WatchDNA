import { redirect } from 'next/navigation';

// /settings 直接跳转到 /settings/account
// 行业常用模式：用 redirect 做子路由的默认跳转，避免空页面
export default function SettingsPage() {
  redirect('/settings/account');
}
