// src/components/Navbar.tsx
'use client' // 声明为客户端组件，因为我们需要用到 useState 处理菜单展开

import { useState } from 'react'
import Link from 'next/link'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo 区 */}
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          🚀 <span className="hidden sm:inline">极客 Prompt 社区</span>
          <span className="sm:hidden">Prompt 社区</span> {/* 移动端精简名称 */}
        </Link>

        {/* 桌面端导航 (中大屏显示，小屏隐藏) */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link href="/login" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition">
            登录 / 注册
          </Link>
          <Link href="/publish" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition font-medium text-sm shadow-sm">
            + 发布 Prompt
          </Link>
        </div>

        {/* 移动端汉堡按钮 (中大屏隐藏，小屏显示) */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                // 叉叉图标 (关闭)
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                // 汉堡图标 (展开)
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单面板 */}
      {isOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-100 px-4 py-4 space-y-4 shadow-inner">
          <Link 
            href="/login" 
            onClick={() => setIsOpen(false)} // 点击后自动收起菜单
            className="block text-gray-700 font-medium text-base hover:text-blue-600 transition"
          >
            登录 / 注册
          </Link>
          <Link 
            href="/publish" 
            onClick={() => setIsOpen(false)}
            className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-center font-bold text-base shadow-sm hover:bg-blue-700 transition"
          >
            + 发布 Prompt
          </Link>
        </div>
      )}
    </header>
  )
}