import { presetFiles } from '@/data/presets';

export interface PresetPrompt {
  title: string
  tags: string[]
  description: string
  content: string
  commit_message?: string
}

// 固定的假时间，防止每次调用生成新时间导致 React 重新渲染警告
const MOCK_DATE = new Date('2024-01-01T00:00:00Z').toISOString();

export function getAllPresets(): any[] {
  const presets = Object.keys(presetFiles).map(key => {
    const data = presetFiles[key] as PresetPrompt;
    
    return {
      id: `preset-${key}`,
      author_id: 'preset-author',
      title: data.title,
      description: data.description,
      tags: data.tags,
      likes_count: 99, 
      created_at: MOCK_DATE,
      profiles: {
        username: '官方预设',
        avatar_url: null
      },
      _rawContent: data.content,
      _rawCommitMsg: data.commit_message
    }
  })

  return presets
}

export function getPresetById(id: string): any | null {
  const key = id.replace('preset-', '');
  const data = presetFiles[key] as PresetPrompt;
  
  if (!data) {
    console.error('Error finding preset file for key:', key)
    return null
  }
  
  return {
    id: id,
    author_id: 'preset-author',
    title: data.title,
    description: data.description,
    tags: data.tags,
    likes_count: 99,
    created_at: MOCK_DATE,
    profiles: {
      username: '官方预设',
      avatar_url: null
    },
    _rawContent: data.content,
    _rawCommitMsg: data.commit_message
  }
}
