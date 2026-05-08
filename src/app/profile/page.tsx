// src/app/profile/page.tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/authService'

export default function ProfileRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        if (user) {
          router.replace(`/profile/${user.id}`)
        } else {
          window.location.href = "https://auth.wsw.wiki/login?redirect_to=https://prompt.wsw.wiki/profile"
        }
      } catch (error) {
        console.error("Failed to check auth for profile redirect", error)
        window.location.href = "https://auth.wsw.wiki/login?redirect_to=https://prompt.wsw.wiki/profile"
      }
    }
    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">定位水分子坐标中...</p>
      </div>
    </div>
  )
}
