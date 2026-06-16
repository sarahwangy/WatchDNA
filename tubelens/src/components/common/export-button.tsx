'use client';

interface ExportButtonProps {
  href: string; // API route that returns CSV
  label?: string;
}

// 点击后浏览器会直接触发文件下载（因为 API 返回了 Content-Disposition: attachment 头）
export function ExportButton({ href, label = 'Export CSV' }: ExportButtonProps) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors"
    >
      ↓ {label}
    </a>
  );
}
