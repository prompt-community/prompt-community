import { supabase } from '@/lib/supabase'

export interface SiteAnnouncement {
  id: string
  title: string | null
  content: string
  updated_at: string | null
}

interface AnnouncementRow extends SiteAnnouncement {
  enabled: boolean
  starts_at: string | null
  ends_at: string | null
}

function isActiveAnnouncement(announcement: AnnouncementRow) {
  if (!announcement.enabled || !announcement.content.trim()) return false

  const now = Date.now()
  if (announcement.starts_at && new Date(announcement.starts_at).getTime() > now) {
    return false
  }

  if (announcement.ends_at && new Date(announcement.ends_at).getTime() <= now) {
    return false
  }

  return true
}

export async function getHomeAnnouncement(): Promise<SiteAnnouncement | null> {
  const { data, error } = await supabase
    .from('site_announcements')
    .select('id, title, content, enabled, starts_at, ends_at, updated_at')
    .eq('placement', 'home')
    .eq('enabled', true)
    .order('priority', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(5)

  if (error || !data) return null

  const announcement = (data as AnnouncementRow[]).find(isActiveAnnouncement)
  if (!announcement) return null

  return {
    id: announcement.id,
    title: announcement.title,
    content: announcement.content,
    updated_at: announcement.updated_at,
  }
}
