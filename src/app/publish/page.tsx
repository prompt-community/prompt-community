// src/app/publish/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { authService } from '@/lib/authService'

export default function PublishPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  // 页面加载时验证身份
  useEffect(() => {
    const checkAuth = async () => {
      const user = await authService.getCurrentUser()      
      if (!user) {
        // 如果没登录，直接踢回登录页
        window.location.href = "https://auth.wsw.wiki/login?redirect_to=https://prompt.wsw.wiki/publish"
      } else {
        setUserId(user.id)
      }
    }
    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userId) return

    setLoading(true)
    setErrorMsg('')

    try {
      // 1. 插入 prompts 主表
      // 注意：必须严格传入 author_id，这会接受我们底层 RLS 策略的严格审查
      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert([{ 
          title, 
          description, 
          author_id: userId 
        }])
        .select()
        .single()

      if (promptError) throw promptError

      // 2. 插入 prompt_versions 历史版本子表
      // 携带刚刚生成的主表 ID，以及真正的 Prompt 内容
      const { error: versionError } = await supabase
        .from('prompt_versions')
        .insert([{ 
          prompt_id: promptData.id, 
          content: content,
          commit_message: 'Initial commit: 创世发布' 
        }])

      if (versionError) {
        // 水分子容错：如果版本表插入失败，尝试回滚（删除主表）
        await supabase.from('prompts').delete().eq('id', promptData.id)
        throw versionError
      }

      // 3. 发布成功，跳转回大厅！
      router.push('/')
      router.refresh() // 强制 Next.js 清除 SSR 缓存，瞬间展示新数据

    } catch (error) {
      setErrorMsg((error as Error).message || '发布失败，请检查网络或控制台')
    } finally {
      setLoading(false)
    }
  }

  // 极简加载状态防御
  if (!userId) return <div className="min-h-screen flex items-center justify-center">身份核验中...</div>

  return (
    <main className="min-h-screen text-gray-800 bg-gray-50 py-12 font-sans">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
          ➕ 发布你的水分子 Prompt
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-6">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200 font-medium">
              ❌ {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              标题 (Title) <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="例如：Python 报错智能抓取助手"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              简短描述 (Description)
            </label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="一句话说明这个 Prompt 解决什么痛点..."
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Prompt 核心指令 (Content) <span className="text-red-500">*</span>
            </label>
            <textarea 
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm transition"
              placeholder="在此输入你要分享的完整 Prompt 文本..."
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              发布即代表你同意基于 <a href="#" className="text-blue-600 hover:underline">MIT 协议</a> 开源此内容。
            </p>
            <button 
              type="submit"
              disabled={loading}
              className="bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-black transition shadow-md disabled:opacity-50"
            >
              {loading ? '正在写入数据库...' : '确认发布 🚀'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}