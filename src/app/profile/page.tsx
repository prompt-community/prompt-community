// src/app/profile/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/authService'
import { generateInitialAvatar } from '@/lib/avatar'
import toast, { Toaster } from 'react-hot-toast'

interface UserProfile {
  id: string
  email?: string
  username: string
  avatar_url: string | null
  role: string | null
  points: number
}

// 定义等级阈值和对应样式
const LEVEL_THRESHOLDS = [
  { level: 1, name: '白开水', min: 0, max: 9, color: 'from-slate-300 to-slate-400', badge: 'bg-slate-100 text-slate-700' },
  { level: 2, name: '纯净水', min: 10, max: 49, color: 'from-blue-300 to-cyan-400', badge: 'bg-cyan-100 text-cyan-800' },
  { level: 3, name: '矿泉水', min: 50, max: 199, color: 'from-emerald-300 to-teal-400', badge: 'bg-emerald-100 text-emerald-800' },
  { level: 4, name: '蒸馏水', min: 200, max: 499, color: 'from-indigo-400 to-purple-500', badge: 'bg-purple-100 text-purple-800' },
  { level: 5, name: '重水', min: 500, max: Infinity, color: 'from-rose-500 to-orange-500', badge: 'bg-rose-100 text-rose-800' },
]

function getLevelInfo(points: number) {
  return LEVEL_THRESHOLDS.find(t => points >= t.min && points <= t.max) || LEVEL_THRESHOLDS[0]
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // 昵称编辑状态
  const [isEditing, setIsEditing] = useState(false)
  const [editUsername, setEditUsername] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authService.getUserProfile()
        if (!data) {
          window.location.href = "https://auth.wsw.wiki/login?redirect_to=https://prompt.wsw.wiki/profile"
          return
        }
        setProfile(data)
      } catch (error) {
        console.error("Failed to fetch profile", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleEditClick = () => {
    setEditUsername(profile?.username || '')
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditUsername('')
  }

  const handleSaveUsername = async () => {
    if (!profile) return
    const trimmed = editUsername.trim()
    if (!trimmed) {
      toast.error('昵称不能为空')
      return
    }

    // 正则校验：只能输入英文、数字或中文汉字
    const validRegex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
    if (!validRegex.test(trimmed)) {
      toast.error('昵称只能包含英文、数字或中文汉字')
      return
    }

    if (trimmed.length > 15) {
      toast.error('昵称最多 15 个字符')
      return
    }

    if (trimmed === profile.username) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)
    try {
      await authService.updateUsername(profile.id, trimmed)
      setProfile({ ...profile, username: trimmed })
      toast.success('昵称修改成功！')
      setIsEditing(false)
      window.dispatchEvent(new Event('profileUpdated'))
    } catch (error) {
      toast.error('修改失败，可能是网络错误')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium">核验水分子身份中...</p>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const levelInfo = getLevelInfo(profile.points)
  const nextLevel = LEVEL_THRESHOLDS.find(t => t.level === levelInfo.level + 1)

  let progress = 100
  let pointsNeeded = 0
  if (nextLevel) {
    const range = nextLevel.min - levelInfo.min
    const current = profile.points - levelInfo.min
    progress = Math.max(0, Math.min(100, (current / range) * 100))
    pointsNeeded = nextLevel.min - profile.points
  }

  // 使用新的首字母头像生成器
  const displayNameForAvatar = profile.username || profile.email?.split('@')[0] || '匿'
  const defaultAvatar = generateInitialAvatar(displayNameForAvatar)

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <Toaster position="bottom-right" />
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transform transition-all hover:shadow-2xl">

          {/* Header Banner - 动态渐变背景展示当前等级颜色 */}
          <div className={`h-40 bg-gradient-to-r ${levelInfo.color} opacity-90 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/20 blur-2xl rounded-full"></div>
          </div>

          {/* Profile Content */}
          <div className="px-8 pb-10 relative">
            {/* Avatar Section */}
            <div className="flex justify-between items-end -mt-20 mb-6 relative z-10">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl p-1 bg-white shadow-lg relative">
                  <img
                    src={profile.avatar_url || defaultAvatar}
                    alt="Avatar"
                    className="w-full h-full rounded-xl object-cover bg-gray-100"
                  />
                </div>
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black shadow-md whitespace-nowrap border border-white/80 backdrop-blur-sm transition-transform group-hover:scale-105 ${levelInfo.badge}`}>
                  Lv. {levelInfo.level} {levelInfo.name}
                </div>
              </div>

              <button
                onClick={() => router.push('/')}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl shadow-md hover:bg-gray-800 hover:shadow-lg transition-all active:scale-95"
              >
                返回大厅
              </button>
            </div>

            {/* User Info */}
            <div className="space-y-2 mb-10">
              <div className="flex items-center gap-3">
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="请输入昵称"
                      disabled={isSaving}
                      className="text-2xl font-extrabold text-gray-900 border-2 border-blue-500 rounded-lg px-3 py-1 outline-none w-64 focus:ring-4 focus:ring-blue-500/20 transition-all bg-white shadow-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveUsername()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={isSaving}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-bold shadow-sm transition-colors text-sm disabled:opacity-50"
                    >
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg font-bold shadow-sm transition-colors text-sm disabled:opacity-50"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
                      {profile.username || '匿名水分子'}
                      <button
                        onClick={handleEditClick}
                        className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 p-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        title="编辑昵称"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      {profile.role === 'admin' && (
                        <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-amber-200 to-amber-100 text-amber-800 rounded-lg flex items-center shadow-sm border border-amber-200">
                          👑 管理员
                        </span>
                      )}
                    </h1>
                  </>
                )}
              </div>

              <p className="text-gray-500 font-medium ml-1">
                {profile.email}
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {/* Points Card */}
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col justify-center shadow-inner relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-7xl opacity-5 group-hover:scale-110 transition-transform duration-500">💧</div>
                <div className="text-gray-500 text-sm font-bold mb-2 relative z-10">当前水滴值 (Points)</div>
                <div className="text-5xl font-black text-gray-900 flex items-baseline gap-2 relative z-10">
                  {profile.points} <span className="text-lg text-gray-400 font-medium">滴</span>
                </div>
              </div>

              {/* Progress Card */}
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-center relative">
                <div className="flex justify-between items-end mb-4">
                  <div className="text-blue-800 text-sm font-bold">等级进度</div>
                  {nextLevel ? (
                    <div className="text-blue-600 text-xs font-medium bg-blue-100/50 px-2 py-1 rounded-md">
                      距离 <b>Lv.{nextLevel.level} {nextLevel.name}</b> 还差 <b className="text-blue-700">{pointsNeeded}</b> 滴
                    </div>
                  ) : (
                    <div className="text-orange-600 text-xs font-bold bg-orange-100/50 px-2 py-1 rounded-md">
                      👑 已达成最高境界
                    </div>
                  )}
                </div>

                <div className="h-4 w-full bg-blue-100/80 rounded-full overflow-hidden border border-blue-200/50 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-8 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400 font-medium flex items-center justify-center gap-2">
                <span>✨ 继续在社区发布高质量 Prompt 以获取更多水滴值</span>
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  )
}
