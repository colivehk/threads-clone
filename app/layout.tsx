import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav'; // 引入我们的底部导航

const inter = Inter({ subsets: ['latin'] });

// 这是全站的 Meta 标签，相当于以前的 <title>，Next.js 会自动帮你生成 SEO 信息！
export const metadata: Metadata = {
  title: 'Threads V2.0',
  description: 'Built with Next.js, Tailwind and pure engineering passion.',
};

// RootLayout 会包裹你所有的网页 (page.tsx)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 强制开启深色模式背景，防止闪瞎眼 */}
      <body className={`${inter.className} bg-white dark:bg-[#101010] text-black dark:text-white`}>
        
        {/* children 就是你具体的每个页面的内容，比如咱们刚才写的首页瀑布流 */}
        {children}

        {/* 将底部导航栏挂载在全局！ */}
        <BottomNav />
        
      </body>
    </html>
  );
}