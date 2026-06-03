/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 14 的内置 lint runner 使用 ESLint v8 的旧 API（useEslintrc、extensions），
  // 但本项目安装的是 ESLint v9，这两个选项已被移除，会导致 build 报错。
  // 解决方案：关闭 Next.js 的内置 lint 检查，由 `npm run lint` 独立负责。
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
