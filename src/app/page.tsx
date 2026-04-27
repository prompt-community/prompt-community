// src/app/page.tsx
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import TagFilter from '@/components/TagFilter'
import { getAllPresets } from '@/lib/presets'
// import Navbar from '@/components/Navbar'

// 强制 Next.js 每次请求都动态拉取最新数据（避免静态编译缓存导致看不到新 Prompt）
export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const tagsParam = params?.tags as string | undefined
  const modeParam = params?.mode as 'and' | 'or' | undefined
  const presetOnly = params?.presetOnly === 'true'

  const selectedTags = tagsParam ? tagsParam.split(',') : []
  const mode = modeParam === 'and' ? 'and' : 'or'

  let prompts: any[] = []
  let error: any = null

  if (presetOnly) {
    let allPresets = getAllPresets()
    if (selectedTags.length > 0) {
      if (mode === 'and') {
        allPresets = allPresets.filter(p => selectedTags.every(tag => p.tags.includes(tag)))
      } else {
        allPresets = allPresets.filter(p => selectedTags.some(tag => p.tags.includes(tag)))
      }
    }
    prompts = allPresets
  } else {
    // 1. SSR 服务端直接连库拉取数据
    // 这里的神来之笔是 `profiles(username)`，它会自动通过外键帮你把作者的名字带出来！
    let query = supabase
      .from('prompts')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false }) // 按时间倒序，最新的在前面

    // 根据选中的标签和匹配模式动态追加过滤条件
    if (selectedTags.length > 0) {
      if (mode === 'and') {
        query = query.contains('tags', selectedTags)
      } else {
        query = query.overlaps('tags', selectedTags)
      }
    }

    const res = await query
    prompts = res.data || []
    error = res.error
  }

  return (
    <main className="min-h-screen bg-gray-50 font-sans">

      {/* 社区大厅内容区 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-gray-800 mb-3">停下脚步，接一杯灵感</h2>
          <p className="text-gray-500 mb-6">探索由中科大同学们分享的优质提示词。在这里交流代码与学术 Prompt ，激发你的下一次沸点。</p>
          <TagFilter selectedTags={selectedTags} mode={mode} presetOnly={presetOnly} />
        </div>

        {/* 错误拦截提示 */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm">
            <p className="font-bold">拉取数据失败</p>
            <p className="text-sm mt-1">{error.message}</p>
          </div>
        )}

        {/* Prompt 瀑布流 / 网格展示 */}
        {prompts && prompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {prompts.map((prompt) => {
              // 提取嵌套的 profile 数据
              const profile = prompt.profiles as { username: string; avatar_url: string } | null
              // 如果有用户名就用用户名，否则显示“匿名水分子”，并且取名字的首字母作为头像占位符
              const authorName = profile?.username || '匿名水分子'
              const initial = authorName.charAt(0).toUpperCase()

              return (
                <Link href={`/prompt/${prompt.id}`} key={prompt.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-xl transition-shadow duration-300 flex flex-col group cursor-pointer">
                  <div className="flex justify-between items-start mb-3 gap-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors flex-1">
                      {prompt.title}
                    </h3>
                    <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-semibold whitespace-nowrap shrink-0">
                      👍 {prompt.likes_count > 99 ? '99+' : prompt.likes_count}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-5 flex-grow line-clamp-3 leading-relaxed">
                    {prompt.description || "这位水分子很懒，没有写任何描述..."}
                  </p>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                        {initial}
                      </div>
                      <span className="text-sm text-gray-500 font-medium">
                        {authorName}
                      </span>
                    </div>
                    {/* 预留标签位置 */}
                    {prompt.tags && prompt.tags.length > 0 && (
                      <div className="flex gap-1 overflow-hidden">
                        {prompt.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200 whitespace-nowrap">
                            #{tag}
                          </span>
                        ))}
                        {prompt.tags.length > 3 && (
                          <span className="text-xs font-medium text-gray-400 px-1 py-1">
                            +{prompt.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          /* 水分子风的空状态 (Empty State) */
          <div className="text-center py-24 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-4xl mb-4">📭</span>
            <p className="text-gray-500 mb-6 text-lg font-medium">大厅空空如也，亟待硬核内容注入！</p>
            <Link href="/publish" className="inline-flex items-center justify-center bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-black transition shadow-md font-medium">
              抢占天字一号首发
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}