'use client'

import { useRouter } from 'next/navigation'

const PRESET_TAGS = ['开发', '学术', '写作', '设计', '效率', '娱乐']

export default function TagFilter({
  selectedTags = [],
  mode = 'or'
}: {
  selectedTags: string[]
  mode: 'and' | 'or'
}) {
  const router = useRouter()

  const toggleTag = (tag: string) => {
    let newTags = [...selectedTags]
    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag)
    } else {
      newTags.push(tag)
    }
    updateURL(newTags, mode)
  }

  const toggleMode = () => {
    const newMode = mode === 'or' ? 'and' : 'or'
    updateURL(selectedTags, newMode)
  }

  const updateURL = (tags: string[], newMode: 'and' | 'or') => {
    const params = new URLSearchParams()
    if (tags.length > 0) {
      params.set('tags', tags.join(','))
    }
    if (newMode !== 'or') {
      params.set('mode', newMode)
    }
    router.push(`/?${params.toString()}`)
  }

  return (
    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm font-semibold text-gray-500 mr-2">过滤标签:</span>
        {PRESET_TAGS.map(tag => {
          const isSelected = selectedTags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>
      
      {selectedTags.length > 1 && (
        <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 transition-all">
          <span className="text-xs font-medium text-gray-500">匹配模式:</span>
          <button 
            onClick={toggleMode}
            className="flex items-center text-sm font-bold bg-white px-3 py-1 rounded shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {mode === 'or' ? '任意包含 (OR)' : '全部包含 (AND)'}
            <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
          </button>
        </div>
      )}
    </div>
  )
}
