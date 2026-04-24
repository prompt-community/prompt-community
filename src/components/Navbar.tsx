// src/components/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from '@supabase/supabase-js' // 引入 Supabase 官方定义的 User 类型
import { authService } from '@/lib/authService'
import { supabase } from '@/lib/supabase'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null) // 使用 User | null 代替 any
  const [loading, setLoading] = useState(true)

  // 定义独立域名的认证地址，方便后续统一修改
  const AUTH_URL = "https://auth.wsw.wiki/login?redirect_to=https://prompt.wsw.wiki"

  // const AUTH_URL = "/login"

  useEffect(() => {
    // 1. 组件挂载时获取当前用户
    const fetchUser = async () => {
      const currentUser = await authService.getCurrentUser()
      console.log("当前用户信息：", currentUser) // 🔥 调试输出，验证用户对象结构
      setUser(currentUser)
      console.log(user)
      setLoading(false)
    }
    fetchUser()

    // 2. 监听登录状态变化 (处理登录、登出、Token 过期等情况)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (process.env.NODE_ENV === 'development') {
        return
        // setUser(currentUser)
      }
      setUser(session?.user || null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await authService.signOut()
    setUser(null)
  }

  // 提取显示名称：优先显示邮箱前缀
  const displayName = user?.email?.split('@')[0] || '水分子'

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 font-sans">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo 区 */}
        <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
          💧 <span className="hidden sm:inline"> Prompt 饮水机 - 优质 Prompt 开源社区</span>
          <span className="sm:hidden">Prompt 饮水机</span>
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden md:flex space-x-6 items-center">
          {loading ? (
            <div className="text-sm text-gray-400 animate-pulse">验证中...</div>
          ) : user ? (
            // 已登录状态：显示用户昵称和退出按钮
            <div className="flex items-center gap-5">
              <span className="text-gray-700 font-medium text-sm">
                你好, <span className="text-blue-600">{displayName}</span>
              </span>
              <button 
                onClick={handleSignOut} 
                className="text-gray-500 hover:text-red-600 font-medium text-sm transition"
              >
                退出
              </button>
              <Link href="/publish" className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition font-medium text-sm shadow-sm">
                + 发布 Prompt
              </Link>
            </div>
          ) : (
            // 未登录状态：跳转至独立认证域名
            <>
              <a href={AUTH_URL} className="text-gray-600 hover:text-blue-600 font-medium text-sm transition">
                登录 / 注册
              </a>
              <a href={AUTH_URL} className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition font-medium text-sm shadow-sm">
                + 发布 Prompt
              </a>
            </>
          )}
        </div>

        {/* 移动端汉堡按钮 */}
        <div className="md:hidden flex items-center">
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 移动端下拉菜单 */}
      {isOpen && (
        <div className="md:hidden bg-gray-50 border-t border-gray-100 px-4 py-4 space-y-4 shadow-inner">
          {user ? (
            <>
              <div className="px-2 py-1 text-gray-700 font-bold border-b border-gray-200">
                👤 {displayName}
              </div>
              <Link 
                href="/publish" 
                onClick={() => setIsOpen(false)}
                className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-center font-bold text-base shadow-sm"
              >
                + 发布 Prompt
              </Link>
              <button 
                onClick={() => { handleSignOut(); setIsOpen(false); }}
                className="w-full text-center py-2 text-red-500 font-medium"
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <a 
                href={AUTH_URL}
                className="block text-gray-700 font-medium text-base hover:text-blue-600 transition px-2"
              >
                登录 / 注册
              </a>
              <a 
                href={AUTH_URL}
                className="block bg-blue-600 text-white px-4 py-3 rounded-lg text-center font-bold text-base shadow-sm"
              >
                + 发布 Prompt
              </a>
            </>
          )}
        </div>
      )}
    </header>
  )
}