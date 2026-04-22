// src/app/prompt/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import * as Diff from 'diff'

interface PromptData {
  id: string;
  title: string;
  description: string;
  profiles?: { username: string };
}

interface PromptVersion {
  id: string;
  prompt_id: string;
  content: string;
  commit_message: string | null; // 允许为 null，因为有些更新可能没写日志
  created_at: string;
}

export default function PromptDetailPage() {
  // useParams 会自动提取 URL 里的动态 [id]
  const { id } = useParams()
  const [prompt, setPrompt] = useState<PromptData | null>(null)
  const [versions, setVersions] = useState<PromptVersion[]>([])
  const [loading, setLoading] = useState(true)

  // 选中的版本索引，默认 0 为最新版
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      // 1. 获取主表信息与作者名
      const { data: pData } = await supabase
        .from('prompts')
        .select('*, profiles(username)')
        .eq('id', id)
        .single()

      // 2. 获取该 Prompt 的所有历史版本（按时间倒序：最新在最前）
      const { data: vData } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', id)
        .order('created_at', { ascending: false })

      setPrompt(pData)
      setVersions(vData || [])
      setLoading(false)
    }
    
    if (id) fetchData()
  }, [id])
  const handleCopy = async () => {
    if (!currentVersion?.content) return
    try {
      await navigator.clipboard.writeText(currentVersion.content)
      setCopied(true)
      // 2秒后恢复原状
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">正在从数据库跃迁数据...</div>
  if (!prompt || versions.length === 0) return <div className="min-h-screen flex items-center justify-center">未找到该 Prompt 及其版本</div>

  // 核心魔法：计算版本差异 (Diff)
  const currentVersion = versions[selectedIndex]
  // 如果选中了最新版，旧版就是上一个版本（索引+1）；如果已经是最初版，则没有旧版
  const oldVersion = selectedIndex < versions.length - 1 ? versions[selectedIndex + 1] : null
  
  // 仅当存在旧版本时，执行 diff 对比
  const diffResult = oldVersion 
    ? Diff.diffWords(oldVersion.content, currentVersion.content)
    : null

  return (
    <main className="min-h-screen bg-gray-50 py-12 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* 头部信息 */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 mb-6 group">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition">
              {prompt.title}
            </h1>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              作者: {prompt.profiles?.username || '匿名'}
            </span>
          </div>
          <p className="text-gray-600">{prompt.description}</p>
        </div>

        {/* 版本控制与时光机 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
            <h2 className="text-white font-medium flex items-center gap-2">
              <span>⏱️</span> 版本时光机 (Diff Viewer)
            </h2>
            {/* 新增的外层容器，让下拉框和复制按钮并排 */}
            <div className="flex items-center gap-3"></div>
            <select 
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="bg-gray-800 text-green-400 border border-gray-700 p-2 rounded-md outline-none text-sm font-mono cursor-pointer"
            >
              {versions.map((v, i) => (
                <option key={v.id} value={i}>
                  {i === 0 ? '最新版' : `版本 v${versions.length - i}`} - {new Date(v.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
            {/* 核心：一键复制按钮 */}
            <button
              onClick={handleCopy}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
              >
              {copied ? '✅ 已复制' : '📋 一键复制'}
            </button>

          </div>

          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-500 font-mono">
              <strong>更新日志：</strong> {currentVersion.commit_message || '无'}
            </p>
          </div>

          {/* Prompt 文本展示区 */}
          <div className="p-6 font-mono text-sm leading-relaxed whitespace-pre-wrap text-gray-800 overflow-x-auto">
            {diffResult ? (
              // 渲染 Diff 高亮
              diffResult.map((part, index) => {
                const colorClass = part.added 
                  ? 'bg-green-100 text-green-800 font-bold px-1 rounded' 
                  : part.removed 
                    ? 'bg-red-100 text-red-800 line-through px-1 rounded opacity-70' 
                    : 'text-gray-700'
                return (
                  <span key={index} className={colorClass}>
                    {part.value}
                  </span>
                )
              })
            ) : (
              // 渲染纯文本（最初版没有可对比的旧版本）
              <span>{currentVersion.content}</span>
            )}
          </div>
        </div>

      </div>
    </main>
  )
}