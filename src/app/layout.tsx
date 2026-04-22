import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer'; // 👈 新增：引入你的 Footer 组件

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 👈 顺手优化：修改全局 SEO 和浏览器标签页信息
export const metadata: Metadata = {
  title: "Prompt 饮水机 (The Water Cooler)", 
  description: "由水分子极客们共同构建的优质 AI Prompt 分享与协作平台",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* 顶部全局导航栏 */}
        <Navbar />

        {/* 核心魔法：用 <main> 标签包裹子页面，并加上 flex-1 
          这会告诉浏览器：“不管中间内容有多少，请尽全力撑满剩余空间！”
          这样无论页面多空，Footer 都会被稳稳地压在屏幕最底端。
        */}
        <main className="flex-1">
          {children}
        </main>

        {/* 底部全局页脚 */}
        <Footer />
      </body>
    </html>
  );
}