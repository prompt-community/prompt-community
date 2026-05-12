// src/components/ShareImageModal.tsx
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { QRCodeSVG } from 'qrcode.react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ShareImageModalProps {
  isOpen: boolean
  onClose: () => void
  prompt: {
    id: string
    title: string
    description?: string
    tags?: string[]
    custom_tags?: string[]
  }
  content: string // 当前版本的 prompt 内容
}

export default function ShareImageModal({ isOpen, onClose, prompt, content }: ShareImageModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  const promptUrl = `https://ai.wsw.wiki/prompt/${prompt.id}`
  const allTags = [...(prompt.tags || []), ...(prompt.custom_tags || [])]

  const generateImage = useCallback(async () => {
    if (!cardRef.current) return
    setGenerating(true)
    try {
      // 等待 QRCode SVG 和字体渲染完成
      await new Promise(resolve => setTimeout(resolve, 500))

      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 2, // 2x 高清
        backgroundColor: '#ffffff',
      })
      setImageUrl(dataUrl)
    } catch (err) {
      console.error('生成分享图失败:', err)
    } finally {
      setGenerating(false)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setImageUrl(null)
      setCopySuccess(false)
      // 延迟执行以确保 DOM 已渲染
      const timer = setTimeout(() => {
        generateImage()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, generateImage])

  const handleDownload = () => {
    if (!imageUrl) return
    const link = document.createElement('a')
    link.download = `prompt-${prompt.id}.png`
    link.href = imageUrl
    link.click()
  }

  const handleCopyToClipboard = async () => {
    if (!imageUrl) return
    try {
      const res = await fetch(imageUrl)
      const blob = await res.blob()
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('复制到剪贴板失败:', err)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        {/* Modal 头部 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">📤 分享 Prompt</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition">
            ✕
          </button>
        </div>

        {/* 预览区域 */}
        <div className="mb-4 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center min-h-[200px]">
          {generating ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-500">生成分享图中...</span>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="分享图预览" className="w-full" />
          ) : (
            <span className="text-sm text-gray-400 py-8">生成失败，请重试</span>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!imageUrl}
            className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            💾 下载图片
          </button>
          <button
            onClick={handleCopyToClipboard}
            disabled={!imageUrl}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {copySuccess ? '✅ 已复制' : '📋 复制图片'}
          </button>
        </div>

        {/* 重新生成 */}
        <button
          onClick={generateImage}
          disabled={generating}
          className="w-full mt-2 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition"
        >
          🔄 重新生成
        </button>
      </div>

      {/* ========================================
          离屏渲染的分享卡片 —— 用于截图生成
          ======================================== */}
      <div style={{ position: 'fixed', left: '-9999px', top: '0' }}>
        <div
          ref={cardRef}
          className="share-card"
          style={{ width: '440px', fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Header 区域：渐变背景 */}
          <div className="share-card-header">
            <div className="share-card-header-top">
              <div className="share-card-title-area">
                <h1 className="share-card-title">{prompt.title}</h1>
                {prompt.description && (
                  <p className="share-card-desc">{prompt.description}</p>
                )}
                {allTags.length > 0 && (
                  <div className="share-card-tags">
                    {allTags.slice(0, 5).map((tag: string) => (
                      <span key={tag} className="share-card-tag">#{tag}</span>
                    ))}
                    {allTags.length > 5 && (
                      <span className="share-card-tag share-card-tag-more">+{allTags.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
              {/* 标题旁的小二维码 */}
              <div className="share-card-qr-small">
                <QRCodeSVG
                  value={promptUrl}
                  size={72}
                  bgColor="transparent"
                  fgColor="#ffffff"
                  level="M"
                />
              </div>
            </div>
          </div>

          {/* 内容区域：Markdown 渲染 */}
          <div className="share-card-content">
            <div className="share-card-content-inner markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
            {/* 渐变遮罩 */}
            <div className="share-card-content-fade" />
          </div>

          {/* Footer 区域 */}
          <div className="share-card-footer">
            <div className="share-card-footer-left">
              <div className="share-card-footer-brand">🌐 ai.wsw.wiki</div>
              <div className="share-card-footer-hint">扫码查看完整 Prompt</div>
            </div>
            <div className="share-card-footer-qr">
              <QRCodeSVG
                value={promptUrl}
                size={56}
                bgColor="#ffffff"
                fgColor="#1e293b"
                level="M"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
