// src/app/prompt/[id]/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'
import * as Diff from 'diff'
import { authService } from '@/lib/authService'
import { toast } from 'react-hot-toast';

// 进阶类型定义
interface PromptData {
  id: string;
  author_id: string; // 新增，用于校验权限
  title: string;
  description: string;
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
  const router = useRouter();
  
  // 核心数据状态
  const [prompt, setPrompt] = useState<PromptData | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthor, setIsAuthor] = useState(false)
  
  // 交互状态
  const [isEditing, setIsEditing] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isCompareMode, setIsCompareMode] = useState(false) 
  const [targetIndex, setTargetIndex] = useState(1) // 对比目标版本
  const [copied, setCopied] = useState(false)

  // 编辑表单状态
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editContent, setEditContent] = useState('')
  const [commitMsg, setCommitMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    // 获取主表和作者
    const { data: pData } = await supabase
      .from('prompts')
      .select('*, profiles(username)')
      .eq('id', id)
      .single()

    // 获取版本历史
    const { data: vData } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', id)
      .order('created_at', { ascending: false })

    // 获取当前用户并核验身份
    const user = await authService.getCurrentUser()
    
    if (pData) {
      setPrompt(pData)
      setEditTitle(pData.title)
      setEditDesc(pData.description || '')
      setIsAuthor(user?.id === pData.author_id)
    }
    
    if (vData) {
      setVersions(vData)
      setEditContent(vData[0]?.content || '')
    }
    
    setLoading(false)
  }, [id])

  useEffect(() => {
    // eslint-disable-next-line
    if (id) fetchData()
  }, [id, fetchData])

  // 处理一键复制
  const handleCopy = async () => {
    const text = versions[selectedIndex]?.content
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 处理提交更新 (产生新版本)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // 1. 更新主表元数据
      const { error: pError } = await supabase
        .from('prompts')
        .update({ title: editTitle, description: editDesc })
        .eq('id', id)

      if (pError) throw pError

      // 2. 插入新版本记录 (不覆盖旧版本)
      const { error: vError } = await supabase
        .from('prompt_versions')
        .insert([{
          prompt_id: id,
          content: editContent,
          commit_message: commitMsg || '无更新日志'
        }])

      if (vError) throw vError

      // 3. 重置状态并刷新数据
      setIsEditing(false)
      setCommitMsg('')
      await fetchData()
      setSelectedIndex(0) // 切换到最新的版本
      
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    // 防误触二次确认
    const confirmed = window.confirm("确定要让这个 Prompt 消失在水世界中吗？此操作不可逆！");
    if (!confirmed) return;

    // 确保 prompt 数据已经加载出来了
    if (!prompt) return; 

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', prompt.id); 

      if (error) throw error;

      toast.success("删除成功，正在返回广场...");
      // 删除成功后跳转回首页
      router.push('/'); 
      
    } catch (error: unknown) {
      toast.error("删除失败: " + (error as Error).message);
      console.error("删除报错:", error);
    }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center">跃迁中...</div>
  if (!prompt) return <div>未找到内容</div>

  // 计算 Diff
  // const currentVersion = versions[selectedIndex]
  // const oldVersion = selectedIndex < versions.length - 1 ? versions[selectedIndex + 1] : null
  // const diffResult = oldVersion ? Diff.diffWords(oldVersion.content, currentVersion.content) : null

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
            <input 
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
                  <p className="text-gray-500">作者: {prompt.profiles?.username}</p>
                </div>
                {/* 身份核验：仅作者可见编辑按钮 */}
                {isAuthor && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition"
                  >
                    ✏️ 编辑
                  </button>
                )}
              </div>
            </div>

            {/* ... 上方的标题等保持不变 ... */}
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
                  {isCompareMode ? (
                    <>
                      <span className="text-gray-400 text-sm">对比:</span>
                      <select value={targetIndex} onChange={e => setTargetIndex(Number(e.target.value))} className="bg-gray-800 text-red-400 p-1.5 rounded text-sm font-mono">
                        {versions.map((v, i) => <option key={v.id} value={i}>v{versions.length - i}</option>)}
                      </select>
                      <span className="text-gray-400 text-sm">与</span>
                    </>
                  ) : null}

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
              
              <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap min-h-75 text-gray-800">
                {isCompareMode ? (
                  // Diff 模式渲染
                  Diff.diffWords(versions[targetIndex]?.content || '', versions[selectedIndex]?.content || '').map((part, i) => (
                    <span key={i} className={part.added ? 'bg-green-100 text-green-800 font-bold' : part.removed ? 'bg-red-100 text-red-800 line-through' : ''}>
                      {part.value}
                    </span>
                  ))
                ) : (
                  // 纯净模式渲染
                  <span>{versions[selectedIndex]?.content}</span>
                )}
              </div>
            </div>

            {/* 👇 新增：危险操作区域 👇 */}
            {isAuthor && (
              <div className="mt-12 pt-8 border-t border-red-200">
                <h3 className="text-red-500 font-bold mb-4 flex items-center gap-2">
                  ⚠️ 危险区域
                </h3>
                <div className="bg-red-50/50 rounded-xl p-6 border border-red-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-red-900 font-medium text-lg">删除此 Prompt</h4>
                    <p className="text-red-600/80 text-sm mt-1">
                      一旦删除，所有历史版本和相关数据将被彻底抹除且不可恢复。
                    </p>
                  </div>
                  <button
                    onClick={handleDelete}
                    className="shrink-0 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white hover:border-red-600 transition-all duration-200 font-medium shadow-sm"
                  >
                    彻底删除
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}