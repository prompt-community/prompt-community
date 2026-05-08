// src/app/prompt/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as Diff from 'diff'
import { authService } from '@/lib/authService'
import { toast } from 'react-hot-toast'
import { User } from '@supabase/supabase-js'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
// import { constrainedMemory } from 'process'

interface PromptData {
  id: string;
  author_id: string;
  title: string;
  description: string; // 确保包含 description
  likes_count: number;
  profiles?: { username: string };
  tags?: string[];
  custom_tags?: string[];
}

interface PromptVersion {
  id: string;
  prompt_id: string;
  content: string;
  commit_message: string | null;
  created_at: string;
}

export default function PromptDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  // 核心数据状态
  const [prompt, setPrompt] = useState<PromptData | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // 权限状态
  const [isAuthor, setIsAuthor] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // --- 新增：元数据编辑状态 (标题/简介/标签) ---
  const [isEditingMeta, setIsEditingMeta] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editSelectedTags, setEditSelectedTags] = useState<string[]>([])
  const [editCustomTagInput, setEditCustomTagInput] = useState('')
  const [savingMeta, setSavingMeta] = useState(false)

  const PRESET_TAGS = ['开发', '学术', '写作', '设计', '效率', '娱乐']

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim()
    if (!trimmed) return
    if (editSelectedTags.length >= 5) {
      toast.error('最多只能添加 5 个标签')
      return
    }
    if (trimmed.length > 15) {
      toast.error('单个标签最多 15 个字符')
      return
    }
    if (editSelectedTags.includes(trimmed)) {
      setEditCustomTagInput('')
      return
    }

    setEditSelectedTags([...editSelectedTags, trimmed])
    setEditCustomTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditSelectedTags(editSelectedTags.filter(t => t !== tagToRemove))
  }

  // --- 版本内容编辑状态 ---
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [commitMsg, setCommitMsg] = useState('')
  const [saving, setSaving] = useState(false)

  // 交互状态
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'preview' | 'source'>('preview')
  const [isCompareMode, setIsCompareMode] = useState(false)
  const [targetIndex, setTargetIndex] = useState(1)
  const [copied, setCopied] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const user = await authService.getCurrentUser()
      setCurrentUser(user)

      if (user) {
        const role = await authService.getRole()
        if (role === 'admin') {
          setIsAdmin(true)
        }
      }

      if (typeof id === 'string' && id.startsWith('preset-')) {
        // 这是本地预设 Prompt，从 API 路由拉取数据
        try {
          const res = await fetch(`/api/presets/${id}`)
          if (!res.ok) throw new Error('Preset not found')
          const presetData = await res.json()

          setPrompt(presetData)
          setLikesCount(presetData.likes_count)

          // 伪造版本历史，仅展示初始预设内容
          setVersions([{
            id: 'v1',
            prompt_id: presetData.id,
            content: presetData._rawContent,
            commit_message: presetData._rawCommitMsg || 'Initial preset version',
            created_at: presetData.created_at
          }])
          setEditContent(presetData._rawContent)

          // 预设模式下强行褫夺所有编辑权限
          setIsAuthor(false)
          setIsAdmin(false)

          setLoading(false)
          return
        } catch (err) {
          console.error('Error fetching preset:', err)
          return setLoading(false)
        }
      }

      // 获取主表数据
      const { data: promptData, error: pError } = await supabase
        .from('prompts')
        .select('*, profiles(username)')
        .eq('id', id)
        .single()

      if (pError || !promptData) return setLoading(false)

      setPrompt(promptData)
      setLikesCount(promptData.likes_count || 0)

      // 初始化编辑表单的数据
      setEditTitle(promptData.title)
      setEditDescription(promptData.description || '')
      setEditSelectedTags([...(promptData.tags || []), ...(promptData.custom_tags || [])])

      if (user && promptData.author_id === user.id) {
        setIsAuthor(true)
      }

      if (user) {
        const { data: likeData } = await supabase
          .from('prompt_likes')
          .select('*')
          .eq('user_id', user.id)
          .eq('prompt_id', id)
          .single()
        if (likeData) setIsLiked(true)
      }

      const { data: versionData } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', id)
        .order('created_at', { ascending: false })

      if (versionData) {
        setVersions(versionData)
        setEditContent(versionData[0]?.content || '')
      }
      setLoading(false)
    }

    fetchData()
  }, [id])

  // --- 新增：保存主表元数据 (无版本记录) ---
  const handleMetaUpdate = async () => {
    if (!editTitle.trim()) return toast.error("标题不能为空")
    setSavingMeta(true)
    try {
      const presetTags = editSelectedTags.filter(tag => PRESET_TAGS.includes(tag))
      const customTags = editSelectedTags.filter(tag => !PRESET_TAGS.includes(tag))

      const { error } = await supabase
        .from('prompts')
        .update({
          title: editTitle,
          description: editDescription,
          tags: presetTags,
          custom_tags: customTags
        })
        .eq('id', id)

      if (error) throw error

      // 乐观更新本地状态
      setPrompt(prev => prev ? {
        ...prev,
        title: editTitle,
        description: editDescription,
        tags: presetTags,
        custom_tags: customTags
      } : null)
      setIsEditingMeta(false)
      toast.success("基础信息修改成功！")
    } catch (err: unknown) {
      toast.error("修改失败: " + (err as Error).message)
    } finally {
      setSavingMeta(false)
    }
  }

  // 保存新版本 (有版本记录)
  const handleVersionUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error: vError } = await supabase.from('prompt_versions').insert([{
        prompt_id: id,
        content: editContent,
        commit_message: commitMsg || `Updated to V${versions.length + 1}`
      }])
      if (vError) throw vError
      toast.success("新版本发布成功！")
      window.location.reload() // 刷新获取最新版本记录
    } catch (err: unknown) {
      toast.error("发布失败: " + (err as Error).message)
      setSaving(false)
    }
  }

  const handleToggleLike = async () => {
    if (!currentUser) return toast.error("请先登录水世界通行证")
    if (isLikeLoading) return

    setIsLikeLoading(true)
    const newIsLiked = !isLiked
    setIsLiked(newIsLiked)
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1)

    try {
      if (newIsLiked) {
        await supabase.from('prompt_likes').insert([{ user_id: currentUser.id, prompt_id: id }])
      } else {
        await supabase.from('prompt_likes').delete().eq('user_id', currentUser.id).eq('prompt_id', id)
      }
    } catch (err: unknown) {
      console.error("点赞操作失败: ", err)
      setIsLiked(!newIsLiked)
      setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1)
      toast.error("操作失败")
    } finally {
      setIsLikeLoading(false)
    }
  }

  const executeDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id)
      if (error) throw error
      toast.success("Prompt 已从水世界蒸发")
      router.push('/')
    } catch (err: unknown) {
      toast.error("删除失败: " + (err as Error).message)
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(versions[selectedIndex]?.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="p-20 text-center font-mono">加载中...</div>
  if (!prompt) return <div className="p-20 text-center font-mono">Prompt 未找到</div>

  const hasPermission = isAuthor || isAdmin

  return (
    <main className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4">

        {/* 新增：元数据编辑模式 */}
        {isEditingMeta ? (
          <div className="bg-white p-8 rounded-xl shadow-md border-2 border-gray-200 mb-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">⚙️ 修改基础信息</h2>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
              className="w-full p-3 border rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500"
              placeholder="Prompt 标题"
            />
            <textarea
              value={editDescription}
              onChange={e => setEditDescription(e.target.value)}
              className="w-full p-3 border rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="添加一段牛逼的简介吧..."
            />
            {/* 标签编辑区 */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    disabled={editSelectedTags.includes(tag) || editSelectedTags.length >= 5}
                    className="px-3 py-1.5 text-sm rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={editCustomTagInput}
                  onChange={(e) => setEditCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag(editCustomTagInput)
                    }
                  }}
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm"
                  placeholder="输入自定义标签，按回车或点击添加"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(editCustomTagInput)}
                  className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition text-sm border border-gray-200 shadow-sm"
                >
                  添加
                </button>
              </div>
              {editSelectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50/40 border border-blue-100 rounded-lg">
                  {editSelectedTags.map(tag => (
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
            <div className="flex gap-3 pt-2">
              <button onClick={handleMetaUpdate} disabled={savingMeta} className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800">
                {savingMeta ? '保存中...' : '确认修改'}
              </button>
              <button onClick={() => setIsEditingMeta(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                取消
              </button>
            </div>
          </div>
        ) : (
          /* 原有的阅读模式头部（新增了简介显示和新版按钮组） */
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{prompt.title}</h1>
                <p className="text-gray-500 mb-4 flex items-center gap-3">
                  <span>👤 作者: {prompt.profiles?.username}</span>
                  <button
                    onClick={handleToggleLike}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-sm transition-all duration-300 ${isLiked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-200 text-gray-500'
                      }`}
                  >
                    <span className={isLiked ? 'scale-110' : ''}>❤️</span>
                    <span className="font-mono font-bold">{likesCount}</span>
                  </button>
                </p>
                {/* 简介展示区 */}
                {prompt.description && (
                  <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100 mb-2">
                    {prompt.description}
                  </p>
                )}

                {/* 标签展示区 */}
                {(() => {
                  const allTags = [...(prompt.tags || []), ...(prompt.custom_tags || [])];
                  if (allTags.length === 0) return null;
                  return (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {allTags.map((tag: string) => (
                        <span key={tag} className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 shadow-sm">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* 操作按钮组 (作者或管理员可见) */}
              {hasPermission && !isEditing && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => setIsEditingMeta(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2"
                  >
                    ⚙️ 修改基础信息
                    {!isAuthor && isAdmin && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded-full">管理</span>}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">V{versions.length + 1}</span>
                    发布新版本
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 代码版本编辑表单 (剔除了标题输入框) */}
        {isEditing ? (
          <form onSubmit={handleVersionUpdate} className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-500 mb-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                🚀 编写 V{versions.length + 1} 版本
              </h2>
              <span className="text-sm text-gray-500">仅更新代码内容，不影响主表基础信息</span>
            </div>

            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full p-4 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500"
              rows={12}
              placeholder="输入最新的指令内容..."
            />
            <textarea
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
              className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              placeholder="更新日志 (例如：优化了上下文理解逻辑)"
            />
            <div className="flex gap-4">
              <button disabled={saving} type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
                {saving ? '提交中...' : '提交新版本'}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg">
                取消
              </button>
            </div>
          </form>
        ) : (
          /* 版本记录与代码对比区域 (保持不变) */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-white font-medium">⏱️ 版本记录</h2>

                {/* 视图切换按钮组 */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setViewMode('preview');
                      setIsCompareMode(false);
                    }}
                    className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${viewMode === 'preview' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}
                  >
                    👁️ 预览
                  </button>
                  <button
                    onClick={() => setViewMode('source')}
                    className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${viewMode === 'source' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'}`}
                  >
                    📝 源码
                  </button>
                </div>

                {viewMode === 'source' && (
                  <button
                    onClick={() => setIsCompareMode(!isCompareMode)}
                    className={`px-3 py-1 text-xs rounded font-bold ${isCompareMode ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {isCompareMode ? '关闭对比' : '开启版本比对'}
                  </button>
                )}
              </div>

              <div className="flex gap-3 items-center">
                {isCompareMode && (
                  <>
                    <span className="text-gray-400 text-sm">对比:</span>
                    <select value={targetIndex} onChange={e => setTargetIndex(Number(e.target.value))} className="bg-gray-800 text-red-400 p-1.5 rounded text-sm font-mono">
                      {versions.map((v, i) => <option key={v.id} value={i}>v{versions.length - i}</option>)}
                    </select>
                    <span className="text-gray-400 text-sm">与</span>
                  </>
                )}

                <select
                  value={selectedIndex}
                  onChange={e => setSelectedIndex(Number(e.target.value))}
                  className="bg-gray-800 text-green-400 p-1.5 rounded text-sm font-mono"
                >
                  {versions.map((v, i) => (
                    <option key={v.id} value={i}>v{versions.length - i} {i === 0 ? '(最新)' : ''}</option>
                  ))}
                </select>
                <button onClick={handleCopy} className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-gray-600">
                  {copied ? '✅' : '📋 复制'}
                </button>
              </div>
            </div>

            <div className={`p-6 min-h-[300px] ${viewMode === 'source' ? 'font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800' : ''}`}>
              {viewMode === 'preview' ? (
                <div className="markdown-body text-gray-800 sm:text-base text-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {versions[selectedIndex]?.content || ''}
                  </ReactMarkdown>
                </div>
              ) : isCompareMode ? (
                Diff.diffWords(versions[targetIndex]?.content || '', versions[selectedIndex]?.content || '').map((part, i) => (
                  <span key={i} className={part.added ? 'bg-green-100 text-green-800 font-bold' : part.removed ? 'bg-red-100 text-red-800 line-through' : ''}>
                    {part.value}
                  </span>
                ))
              ) : (
                <span>{versions[selectedIndex]?.content}</span>
              )}
            </div>
          </div>
        )}

        {/* 危险区域 */}
        {hasPermission && (
          <div className="mt-12 pt-8 border-t border-red-200">
            <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
              ⚠️ 危险区域
              {!isAuthor && isAdmin && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🛡️ 上帝视角</span>}
            </h3>
            <div className="bg-red-50/50 rounded-xl p-6 border border-red-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-red-900 font-medium text-lg">彻底抹除此 Prompt</h4>
                <p className="text-red-700/80 text-sm mt-1">删除后，所有版本记录和点赞数据都将永久消失。</p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="shrink-0 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-all font-medium shadow-sm"
              >
                删除 Prompt
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 弹窗保持不变 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-in-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto text-2xl">⚠️</div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">确认毁灭吗？</h3>
            <p className="text-gray-500 text-center text-sm mb-6">此操作不可逆。该 Prompt 将从水世界中被物理抹除。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200">再想想</button>
              <button onClick={executeDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 flex justify-center">
                {isDeleting ? '蒸发中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}