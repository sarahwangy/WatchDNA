// 'use client' 是必须的：signIn() 是浏览器操作，不能在服务端运行
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export function LoginButton() {
  return (
    // callbackUrl：登录成功后跳转到 /dashboard
    <Button className="w-full" onClick={() => signIn('google', { callbackUrl: '/dashboard' })}>
      Continue with Google
    </Button>
  );
}
