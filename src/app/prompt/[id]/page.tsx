// src/app/prompt/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation' // 引入 useRouter
import { supabase } from '@/lib/supabase'
import * as Diff from 'diff'
import { authService } from '@/lib/authService'
import { toast } from 'react-hot-toast' // 建议确保安装了此库
import { User } from '@supabase/supabase-js' // 引入 User 类型定义

// 进阶类型定义
interface PromptData {
  id: string;
  author_id: string;
  title: string;
  description: string;
  likes_count: number; // 新增点赞数字段
  profiles?: { username: string };
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
  const [currentUser, setCurrentUser] = useState<User | null>(null) // 新增用户信息状态
  const [isAuthor, setIsAuthor] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false) // 新增：管理员状态
  
  // 交互状态
  const [isEditing, setIsEditing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isCompareMode, setIsCompareMode] = useState(false) 
  const [targetIndex, setTargetIndex] = useState(1)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  // --- 新增：点赞与删除状态 ---
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isLikeLoading, setIsLikeLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 编辑模式临时状态
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [commitMsg, setCommitMsg] = useState('')

  // 初始化加载
  useEffect(() => {
    const fetchData = async () => {
      // 1. 获取当前用户
      const user = await authService.getCurrentUser()
      console.log("👤 当前用户:", user)
      setCurrentUser(user)

      // 新增：查验水世界通行证段位（是否为管理员）
      if (user) {
        const role = await authService.getRole()
        console.log("👤 当前用户:", role)
        if (role === 'admin') {
          setIsAdmin(true)
        }
      }

      // 2. 获取 Prompt 主表数据
      const { data: promptData, error: pError } = await supabase
        .from('prompts')
        .select('*, profiles(username)')
        .eq('id', id)
        .single()

      if (pError || !promptData) return setLoading(false)
      
      setPrompt(promptData)
      setLikesCount(promptData.likes_count || 0)
      setEditTitle(promptData.title)
      
      // 3. 判断权限
      if (user && promptData.author_id === user.id) {
        setIsAuthor(true)
      }

      // 4. 检查点赞状态
      if (user) {
        const { data: likeData } = await supabase
          .from('prompt_likes')
          .select('*')
          .eq('user_id', user.id)
          .eq('prompt_id', id)
          .single()
        if (likeData) setIsLiked(true)
      }

      // 5. 获取版本列表
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

  // --- 新增：点赞逻辑 (乐观更新) ---
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
      // 回滚
      setIsLiked(!newIsLiked)
      setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1)
      toast.error("操作失败")
    } finally {
      setIsLikeLoading(false)
    }
  }

  // --- 新增：删除逻辑 ---
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

  // 复制功能
  const handleCopy = () => {
    navigator.clipboard.writeText(versions[selectedIndex]?.content || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 拦截回车键防止自动提交
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // 阻止默认的表单提交行为
    }
  };

  // 发布新版本 (保持原有逻辑)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error: vError } = await supabase.from('prompt_versions').insert([{
        prompt_id: id,
        content: editContent,
        commit_message: commitMsg || `Updated to V${versions.length + 1}`
      }])
      if (vError) throw vError
      window.location.reload()
    } catch (err: unknown) {
      alert((err as Error).message)
      setSaving(false)
    }
  }

  if (loading) return <div className="p-20 text-center font-mono">加载中...</div>
  if (!prompt) return <div className="p-20 text-center font-mono">Prompt 未找到</div>

  return (
    <main className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* 编辑模式表单 */}
        {isEditing ? (
          <form onSubmit={handleUpdate} className="bg-white p-8 rounded-xl shadow-lg border-2 border-blue-500 space-y-6 text-gray-800">
            <h2 className="text-xl font-bold text-gray-800">🛠️ 编辑 Prompt (产生新版本)</h2>
            <input 
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown} // 👈 注入拦截函数
              className="w-full p-3 border rounded-lg text-lg font-bold"
              placeholder="修改标题..."
            />
            <textarea 
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full p-3 border rounded-lg font-mono text-sm"
              rows={10}
              placeholder="修改指令内容..."
            />
            <textarea
              value={commitMsg}
              onChange={e => setCommitMsg(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm"
              placeholder="更新日志 (例如：优化了逻辑)"
            />
            <div className="flex gap-4">
              <button disabled={saving} type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold">
                {saving ? '保存中...' : '发布新版本 V' + (versions.length + 1)}
              </button>
              <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 text-gray-500 font-medium">取消</button>
            </div>
          </form>
        ) : (
          /* 阅读模式界面 */
          <>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{prompt.title}</h1>
                  <p className="text-gray-500 mb-4">作者: {prompt.profiles?.username}</p>
                  
                  {/* 点赞按钮 */}
                  <button 
                    onClick={handleToggleLike}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 ${
                      isLiked ? 'bg-red-50 border-red-200 text-red-500' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    <span className={`transition-transform ${isLiked ? 'scale-110' : ''}`}>❤️</span>
                    <span className="font-mono font-bold">{likesCount}</span>
                  </button>
                </div>
                {/* 👇 修改判断条件：作者或管理员都可见 👇 */}
                {(isAuthor || isAdmin) && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition flex items-center gap-2"
                  >
                    ✏️ 编辑
                    {/* 给管理员一个小小的炫耀徽章 */}
                    {!isAuthor && isAdmin && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">管理越权</span>}
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gray-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-white font-medium">⏱️ 版本记录</h2>
                  <button 
                    onClick={() => setIsCompareMode(!isCompareMode)}
                    className={`px-3 py-1 text-xs rounded font-bold ${isCompareMode ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                  >
                    {isCompareMode ? '关闭对比' : '开启版本比对'}
                  </button>
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
                  <button onClick={handleCopy} className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm font-medium">
                    {copied ? '✅' : '📋 复制'}
                  </button>
                </div>
              </div>
              
              <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-[300px] text-gray-800">
                {isCompareMode ? (
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

            {/* 危险区域 (仅作者可见) */}
            {(isAuthor || isAdmin) && (
              <div className="mt-12 pt-8 border-t border-red-200">
                <h3 className="text-red-500 font-bold mb-4">⚠️ 危险区域</h3>
                <div className="bg-red-50/50 rounded-xl p-6 border border-red-100 flex items-center justify-between">
                  <p className="text-red-700 text-sm">删除此 Prompt 后，所有版本记录都将永久消失。</p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-all font-medium"
                  >
                    彻底删除
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 删除确认 Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl scale-in-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto text-2xl">⚠️</div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">确认毁灭吗？</h3>
            <p className="text-gray-500 text-center text-sm mb-6">此操作不可逆。该 Prompt 将从水世界中被物理抹除。</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium">再想想</button>
              <button onClick={executeDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium">
                {isDeleting ? '蒸发中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}