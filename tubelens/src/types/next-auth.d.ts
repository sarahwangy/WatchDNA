// TypeScript 默认不知道 session.user 上有 id 字段
// 这个文件告诉 TypeScript：user 对象上还有 id 属性
// .d.ts 是"类型声明文件"，只影响类型检查，不产生实际代码
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
    } & DefaultSession['user'];
  }
}
