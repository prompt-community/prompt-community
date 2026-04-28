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

  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [customTagInput, setCustomTagInput] = useState('')

  const PRESET_TAGS = ['开发', '学术', '写作', '设计', '效率', '娱乐']

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (selectedTags.length >= 5) {
      setErrorMsg('最多只能添加 5 个标签')
      return
    }
    if (trimmed.length > 15) {
      setErrorMsg('单个标签最多 15 个字符')
      return
    }
    if (selectedTags.includes(trimmed)) {
      setCustomTagInput('')
      return
    }

    setSelectedTags([...selectedTags, trimmed])
    setCustomTagInput('')
    setErrorMsg('') // 清除之前的错误
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove))
  }

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
      const payload: any = {
        title,
        description,
        author_id: userId
      }

      if (selectedTags.length > 0) {
        payload.tags = selectedTags
      }

      console.log(payload)

      const { data: promptData, error: promptError } = await supabase
        .from('prompts')
        .insert([payload])
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
      window.dispatchEvent(new Event('profileUpdated'))

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

          {/* 标签选择区 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              标签 (Tags) <span className="text-gray-400 font-normal text-xs ml-2">最多5个，方便大家在首页刷到你</span>
            </label>

            {/* 预设标签 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  disabled={selectedTags.includes(tag) || selectedTags.length >= 5}
                  className="px-3 py-1.5 text-sm rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  + {tag}
                </button>
              ))}
            </div>

            {/* 自定义标签输入 */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag(customTagInput)
                  }
                }}
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                placeholder="输入自定义标签，按回车或点击添加"
              />
              <button
                type="button"
                onClick={() => handleAddTag(customTagInput)}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition text-sm border border-gray-200 shadow-sm"
              >
                添加
              </button>
            </div>

            {/* 已选标签展示 */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-50/40 border border-blue-100 rounded-lg">
                {selectedTags.map(tag => (
                  <span key={tag} className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-500 hover:text-blue-800 focus:outline-none w-4 h-4 flex items-center justify-center rounded-full hover:bg-blue-200 transition-colors"
                      title="移除标签"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
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