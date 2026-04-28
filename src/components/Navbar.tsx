// src/components/Navbar.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { authService } from '@/lib/authService'
import { supabase } from '@/lib/supabase'
import { generateInitialAvatar } from '@/lib/avatar'

interface UserProfile {
  id: string
  email?: string
  username: string
  avatar_url: string | null
  role: string | null
  points: number
}

// 定义等级阈值和对应样式 (复用 profile 逻辑)
const LEVEL_THRESHOLDS = [
  { level: 1, name: '白开水', min: 0, max: 9, badge: 'bg-slate-100 text-slate-700' },
  { level: 2, name: '纯净水', min: 10, max: 49, badge: 'bg-cyan-100 text-cyan-800' },
  { level: 3, name: '矿泉水', min: 50, max: 199, badge: 'bg-emerald-100 text-emerald-800' },
  { level: 4, name: '蒸馏水', min: 200, max: 499, badge: 'bg-purple-100 text-purple-800' },
  { level: 5, name: '重水', min: 500, max: Infinity, badge: 'bg-rose-100 text-rose-800' },
]

function getLevelInfo(points: number) {
  return LEVEL_THRESHOLDS.find(t => points >= t.min && points <= t.max) || LEVEL_THRESHOLDS[0]
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 定义独立域名的认证地址，方便后续统一修改
  const AUTH_URL = "https://auth.wsw.wiki/login?redirect_to=https://prompt.wsw.wiki"

  useEffect(() => {
    // 1. 组件挂载时获取当前用户详细资料
    const fetchUser = async () => {
      const profile = await authService.getUserProfile()
      setUser(profile)
      setLoading(false)
    }
    fetchUser()

    // 2. 监听登录状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (process.env.NODE_ENV === 'development') return
      
      if (session?.user) {
        const profile = await authService.getUserProfile()
        setUser(profile)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await authService.signOut()
    setUser(null)
  }

  // 提取显示名称：优先显示昵称，其次邮箱前缀，最后是匿名
  const displayName = user?.username || user?.email?.split('@')[0] || '匿名水分子'
  const defaultAvatar = generateInitialAvatar(displayName)
  const levelInfo = user ? getLevelInfo(user.points) : null

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 font-sans border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo 区 */}
        <Link href="/" className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2 hover:opacity-80 transition">
          <span className="text-2xl">💧</span>
          <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
            Prompt 饮水机
          </span>
          <span className="sm:hidden">Prompt 饮水机</span>
        </Link>

        {/* 桌面端导航 */}
        <div className="hidden md:flex space-x-4 items-center">
          {loading ? (
            <div className="text-sm text-gray-400 animate-pulse bg-gray-100 px-4 py-2 rounded-full">身份核验中...</div>
          ) : user ? (
            <div className="flex items-center gap-4">
              {/* 可点击的用户信息胶囊 -> 跳转 Profile */}
              <Link 
                href="/profile" 
                className="flex items-center gap-3 bg-gray-50 hover:bg-blue-50/60 border border-gray-100 hover:border-blue-200 pr-4 pl-1 py-1 rounded-full transition-all duration-300 shadow-sm hover:shadow group cursor-pointer"
              >
                <img 
                  src={user.avatar_url || defaultAvatar} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-full bg-white border-2 border-white group-hover:scale-105 transition-transform shadow-sm object-cover"
                />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 line-clamp-1">
                    <span className="text-gray-800 font-bold text-sm tracking-tight">{displayName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded shadow-sm font-bold ${levelInfo?.badge}`}>
                      Lv.{levelInfo?.level} {levelInfo?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mt-0.5">
                    <span className="text-blue-500 font-black">{user.points}</span> 滴水
                  </div>
                </div>
              </Link>
              
              <Link href="/publish" className="bg-gray-900 text-white px-5 py-2.5 rounded-full hover:bg-black transition font-bold text-sm shadow hover:shadow-md active:scale-95">
                + 发布 Prompt
              </Link>

              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-500 font-medium text-sm transition p-2 hover:bg-red-50 rounded-full"
                title="退出登录"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <a href={AUTH_URL} className="text-gray-600 hover:text-blue-600 font-bold text-sm transition px-4 py-2 rounded-lg hover:bg-blue-50">
                登录 / 注册
              </a>
              <a href={AUTH_URL} className="bg-blue-600 text-white px-5 py-2.5 rounded-full hover:bg-blue-700 transition font-bold text-sm shadow-md hover:shadow-lg active:scale-95">
                + 发布 Prompt
              </a>
            </div>
          )}
        </div>

        {/* 移动端汉堡按钮 */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-600 hover:text-gray-900 focus:outline-none p-2 bg-gray-50 rounded-lg active:bg-gray-100"
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
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 border-t border-gray-100 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="bg-white px-4 py-5 space-y-4 shadow-inner">
          {user ? (
            <>
              {/* 移动端用户信息大卡片 -> 跳转 Profile */}
              <Link 
                href="/profile" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-blue-50 transition active:scale-[0.98] shadow-sm"
              >
                <img 
                  src={user.avatar_url || defaultAvatar} 
                  alt="Avatar" 
                  className="w-14 h-14 rounded-full bg-white border-2 border-white shadow-sm object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-900 font-bold text-lg">{displayName}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded shadow-sm font-bold ${levelInfo?.badge}`}>
                      Lv.{levelInfo?.level} {levelInfo?.name}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-gray-500">
                    <span className="text-blue-600 font-black text-base">{user.points}</span> 滴水
                  </div>
                </div>
                <div className="text-gray-400 p-2 bg-white rounded-full shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </div>
              </Link>
              
              <Link
                href="/publish"
                onClick={() => setIsOpen(false)}
                className="block bg-gray-900 text-white px-4 py-3 rounded-xl text-center font-bold text-base shadow active:bg-black"
              >
                + 发布 Prompt
              </Link>
              <button
                onClick={() => { handleSignOut(); setIsOpen(false); }}
                className="w-full text-center py-3 bg-red-50 text-red-600 rounded-xl font-bold active:bg-red-100 transition"
              >
                退出登录
              </button>
            </>
          ) : (
            <>
              <a
                href={AUTH_URL}
                className="block text-center py-3 text-gray-700 bg-gray-50 rounded-xl font-bold text-base hover:text-blue-600 active:bg-gray-100 transition"
              >
                登录 / 注册
              </a>
              <a
                href={AUTH_URL}
                className="block bg-blue-600 text-white px-4 py-3 rounded-xl text-center font-bold text-base shadow active:bg-blue-700 transition"
              >
                + 发布 Prompt
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}