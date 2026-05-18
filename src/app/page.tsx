// src/app/page.tsx
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import TagFilter from '@/components/TagFilter'
import AuthorLink from '@/components/AuthorLink'
import AnnouncementModal from '@/components/AnnouncementModal'
import { getHomeAnnouncement } from '@/lib/announcements'
import { getAllPresets } from '@/lib/presets'

// 强制 Next.js 每次请求都动态拉取最新数据（避免静态编译缓存导致看不到新 Prompt）
export const dynamic = 'force-dynamic'

type MatchMode = 'and' | 'or'

type SearchParamValue = string | string[] | undefined

interface PromptCardData {
  id: string
  author_id: string
  title: string
  description?: string | null
  likes_count?: number | null
  tags?: string[] | null
  custom_tags?: string[] | null
  profiles?: {
    username?: string | null
    avatar_url?: string | null
  } | null
}

interface PromptQueryError {
  message: string
}

function getFirstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value
}

function getSelectedTags(tagsParam: SearchParamValue) {
  const rawTags = getFirstParam(tagsParam)
  if (!rawTags) return []

  return Array.from(new Set(
    rawTags
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean)
  ))
}

function getPromptTags(prompt: PromptCardData) {
  return [...(prompt.tags || []), ...(prompt.custom_tags || [])]
}

function matchesSelectedTags(prompt: PromptCardData, selectedTags: string[], mode: MatchMode) {
  if (selectedTags.length === 0) return true

  const promptTags = getPromptTags(prompt)
  if (mode === 'and') {
    return selectedTags.every(tag => promptTags.includes(tag))
  }

  return selectedTags.some(tag => promptTags.includes(tag))
}

function getPresetPrompts(selectedTags: string[], mode: MatchMode) {
  return (getAllPresets() as PromptCardData[])
    .filter(prompt => matchesSelectedTags(prompt, selectedTags, mode))
}

async function getDatabasePrompts(selectedTags: string[], mode: MatchMode) {
  let query = supabase
    .from('prompts')
    .select(`
      *,
      profiles (
        username,
        avatar_url
      )
    `)
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })

  // 根据选中的标签和匹配模式动态追加过滤条件
  if (selectedTags.length > 0) {
    if (mode === 'and') {
      query = query.contains('tags', selectedTags)
    } else {
      query = query.overlaps('tags', selectedTags)
    }
  }

  const { data, error } = await query

  return {
    prompts: (data || []) as PromptCardData[],
    error: error as PromptQueryError | null
  }
}

function PromptCard({ prompt }: { prompt: PromptCardData }) {
  const profile = prompt.profiles
  const authorName = profile?.username || '匿名水分子'
  const initial = authorName.charAt(0).toUpperCase()
  const likesCount = prompt.likes_count || 0
  const allTags = getPromptTags(prompt)

  return (
    <Link href={`/prompt/${prompt.id}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-shadow duration-300 flex flex-col group cursor-pointer">
      <div className="flex justify-between items-start mb-3 gap-3">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors flex-1">
          {prompt.title}
        </h3>
        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap shrink-0">
          👍 {likesCount > 99 ? '99+' : likesCount}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-5 flex-grow line-clamp-3 leading-relaxed">
        {prompt.description || '这位水分子很懒，没有写任何描述...'}
      </p>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
        <AuthorLink authorId={prompt.author_id} authorName={authorName} initial={initial} />
        {allTags.length > 0 && (
          <div className="flex gap-1 overflow-hidden">
            {allTags.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 whitespace-nowrap">
                #{tag}
              </span>
            ))}
            {allTags.length > 3 && (
              <span className="text-xs font-medium text-gray-400 px-1 py-1">
                +{allTags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function PromptGridSkeleton() {
  return (
    <>
      {[0, 1, 2].map(index => (
        <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col animate-pulse">
          <div className="flex justify-between items-start mb-4 gap-3">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-6 bg-blue-50 rounded-full w-14" />
          </div>
          <div className="space-y-2 mb-6">
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-4 bg-gray-100 rounded w-3/5" />
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
            <div className="h-8 bg-gray-100 rounded-full w-28" />
            <div className="h-6 bg-gray-100 rounded-md w-20" />
          </div>
        </div>
      ))}
    </>
  )
}

function EmptyState() {
  return (
    <div className="md:col-span-2 lg:col-span-3 text-center py-24 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center">
      <span className="text-4xl mb-4">📭</span>
      <p className="text-gray-500 mb-6 text-lg font-medium">大厅空空如也，亟待硬核内容注入！</p>
      <Link href="/publish" className="inline-flex items-center justify-center bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition shadow-md font-medium">
        抢占天字一号首发
      </Link>
    </div>
  )
}

function PromptError({ message }: { message: string }) {
  return (
    <div className="md:col-span-2 lg:col-span-3 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm">
      <p className="font-bold">拉取数据失败</p>
      <p className="text-sm mt-1">{message}</p>
    </div>
  )
}

async function DatabasePromptCards({
  selectedTags,
  mode,
  hasPresetPrompts
}: {
  selectedTags: string[]
  mode: MatchMode
  hasPresetPrompts: boolean
}) {
  const { prompts, error } = await getDatabasePrompts(selectedTags, mode)

  if (error) {
    return <PromptError message={error.message} />
  }

  if (prompts.length === 0) {
    return hasPresetPrompts ? null : <EmptyState />
  }

  return (
    <>
      {prompts.map(prompt => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </>
  )
}

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: SearchParamValue }>
}) {
  const params = await searchParams
  const selectedTags = getSelectedTags(params?.tags)
  const mode = getFirstParam(params?.mode) === 'and' ? 'and' : 'or'
  const showPresets = getFirstParam(params?.showPresets) !== 'false'
  const presetPrompts = showPresets ? getPresetPrompts(selectedTags, mode) : []
  const databaseKey = `${selectedTags.join(',')}:${mode}`
  const announcement = await getHomeAnnouncement()

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <AnnouncementModal announcement={announcement} />

      {/* 社区大厅内容区 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3">停下脚步，接一杯灵感</h2>
          <p className="text-gray-500 mb-6">接一杯开源 AI 提示词，让灵感在此沸腾！</p>
          <TagFilter selectedTags={selectedTags} mode={mode} showPresets={showPresets} />
        </div>

        {/* Prompt 瀑布流 / 网格展示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presetPrompts.map(prompt => (
            <PromptCard key={prompt.id} prompt={prompt} />
          ))}
          <Suspense key={databaseKey} fallback={<PromptGridSkeleton />}>
            <DatabasePromptCards
              selectedTags={selectedTags}
              mode={mode}
              hasPresetPrompts={presetPrompts.length > 0}
            />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
