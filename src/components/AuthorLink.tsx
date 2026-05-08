// src/components/AuthorLink.tsx
'use client'

import { useRouter } from 'next/navigation'

interface AuthorLinkProps {
  authorId: string;
  authorName: string;
  initial: string;
}

export default function AuthorLink({ authorId, authorName, initial }: AuthorLinkProps) {
  const router = useRouter()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (authorId) {
      router.push(`/profile/${authorId}`)
    }
  }

  return (
    <button 
      onClick={handleClick} 
      className="flex items-center space-x-2 hover:bg-gray-100 p-1 -ml-1 rounded-md transition-colors z-10"
      title="查看主页"
    >
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-white shadow-inner">
        {initial}
      </div>
      <span className="text-sm text-gray-600 font-bold hover:text-blue-600">
        {authorName}
      </span>
    </button>
  )
}
