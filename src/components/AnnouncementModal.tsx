'use client'

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { SiteAnnouncement } from '@/lib/announcements'

interface AnnouncementModalProps {
  announcement: SiteAnnouncement | null
}

function getLocalDateKey() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function subscribeToClientReady() {
  return () => {}
}

function getStoredDismissal(storageKey: string | null) {
  if (!storageKey || typeof window === 'undefined') return null

  try {
    return window.localStorage.getItem(storageKey)
  } catch {
    return null
  }
}

function setStoredDismissal(storageKey: string | null, value: string) {
  if (!storageKey) return

  try {
    window.localStorage.setItem(storageKey, value)
  } catch {
    // Failing to persist this preference should not block closing the modal.
  }
}

export default function AnnouncementModal({ announcement }: AnnouncementModalProps) {
  const [closedManually, setClosedManually] = useState(false)
  const isClient = useSyncExternalStore(subscribeToClientReady, () => true, () => false)

  const storageKey = useMemo(() => {
    if (!announcement) return null

    return `announcement:dismissed:${announcement.id}:${announcement.updated_at || 'current'}`
  }, [announcement])

  const todayKey = useMemo(() => getLocalDateKey(), [])
  const dismissedDate = isClient ? getStoredDismissal(storageKey) : null
  const isOpen = Boolean(isClient && announcement && !closedManually && dismissedDate !== todayKey)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setClosedManually(true)
      }
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleDismissToday = () => {
    setStoredDismissal(storageKey, getLocalDateKey())
    setClosedManually(true)
  }

  if (!announcement || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-title"
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">站点公告</p>
          <h2 id="announcement-title" className="mt-2 text-xl font-bold text-gray-900">
            {announcement.title || '请注意'}
          </h2>
        </div>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
          <div className="markdown-body announcement-markdown text-sm text-gray-700">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {announcement.content}
            </ReactMarkdown>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleDismissToday}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            今日不再显示
          </button>
          <button
            type="button"
            onClick={() => setClosedManually(true)}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            确定
          </button>
        </div>
      </section>
    </div>
  )
}
