'use client'

import { useRouter } from 'next/navigation'
import { useOptimistic, useTransition } from 'react'

const PRESET_TAGS = ['开发', '学术', '写作', '设计', '效率', '娱乐']

type MatchMode = 'and' | 'or'

interface FilterState {
  selectedTags: string[]
  mode: MatchMode
  showPresets: boolean
}

export default function TagFilter({
  selectedTags = [],
  mode = 'or',
  showPresets = true
}: {
  selectedTags: string[]
  mode: MatchMode
  showPresets?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const currentFilter = {
    selectedTags,
    mode,
    showPresets
  }

  const [optimisticFilter, setOptimisticFilter] = useOptimistic(
    currentFilter,
    (_currentFilter: FilterState, nextFilter: FilterState) => nextFilter
  )

  const toggleTag = (tag: string) => {
    let newTags = [...optimisticFilter.selectedTags]
    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag)
    } else {
      newTags.push(tag)
    }

    navigateWithFilter({
      ...optimisticFilter,
      selectedTags: newTags
    })
  }

  const toggleMode = () => {
    const newMode = optimisticFilter.mode === 'or' ? 'and' : 'or'

    navigateWithFilter({
      ...optimisticFilter,
      mode: newMode
    })
  }

  const toggleShowPresets = () => {
    navigateWithFilter({
      ...optimisticFilter,
      showPresets: !optimisticFilter.showPresets
    })
  }

  const navigateWithFilter = (nextFilter: FilterState) => {
    const params = new URLSearchParams()
    if (nextFilter.selectedTags.length > 0) {
      params.set('tags', nextFilter.selectedTags.join(','))
    }
    if (nextFilter.mode !== 'or') {
      params.set('mode', nextFilter.mode)
    }
    if (!nextFilter.showPresets) {
      params.set('showPresets', 'false')
    }

    // 使用 startTransition 触发低优先级的导航，这会点亮 isPending
    startTransition(() => {
      setOptimisticFilter(nextFilter)
      const queryString = params.toString()
      router.push(queryString ? `/?${queryString}` : '/')
    })
  }

  return (
    <>
      <div className="relative mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-semibold text-gray-500 mr-2">过滤标签:</span>
          {PRESET_TAGS.map(tag => {
            const isSelected = optimisticFilter.selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {tag}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">
            <input
              type="checkbox"
              checked={optimisticFilter.showPresets}
              onChange={toggleShowPresets}
              className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
            />
            <span className="text-sm font-bold">🌟 查看预设 Prompt</span>
          </label>

          {optimisticFilter.selectedTags.length > 1 && (
            <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-all">
              <span className="text-xs font-medium text-gray-500">匹配模式:</span>
              <button
                onClick={toggleMode}
                className="flex items-center text-sm font-bold bg-white px-3 py-1 rounded shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                {optimisticFilter.mode === 'or' ? '任意包含 (OR)' : '全部包含 (AND)'}
                <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 优雅的模糊加载层 */}
      {isPending && (
        <div className="fixed inset-0 z-40 bg-gray-50/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300">
          <div className="bg-white/90 px-6 py-5 rounded-2xl shadow-xl flex flex-col items-center border border-gray-100 mt-20 backdrop-blur-md">
            <div className="w-10 h-10 border-4 border-gray-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-700 font-bold text-sm tracking-wide">抽取数据中...</p>
          </div>
        </div>
      )}
    </>
  )
}
