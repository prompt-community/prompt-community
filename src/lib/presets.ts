import fs from 'fs'
import path from 'path'

export interface PresetPrompt {
  title: string
  tags: string[]
  description: string
  content: string
  commit_message?: string
}

export function getAllPresets(): any[] {
  const presetsDir = path.join(process.cwd(), 'src/data/presets')
  let files: string[] = []
  try {
    files = fs.readdirSync(presetsDir)
  } catch (err) {
    console.error('Error reading presets directory', err)
    return []
  }

  const jsonFiles = files.filter(f => f.endsWith('.json'))
  
  const presets = jsonFiles.map(file => {
    const filePath = path.join(presetsDir, file)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent) as PresetPrompt
    
    return {
      id: `preset-${file.replace('.json', '')}`,
      author_id: 'preset-author',
      title: data.title,
      description: data.description,
      tags: data.tags,
      likes_count: 99, 
      created_at: new Date().toISOString(),
      profiles: {
        username: '官方预设',
        avatar_url: null
      },
      _rawContent: data.content,
      _rawCommitMsg: data.commit_message
    }
  })

  // 按最新时间排序可以不做，因为假数据时间是一样的，可以就按文件名或者默认顺序
  return presets
}

export function getPresetById(id: string): any | null {
  const presetsDir = path.join(process.cwd(), 'src/data/presets')
  const filename = id.replace('preset-', '') + '.json'
  const filePath = path.join(presetsDir, filename)
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent) as PresetPrompt
    
    return {
      id: id,
      author_id: 'preset-author',
      title: data.title,
      description: data.description,
      tags: data.tags,
      likes_count: 99,
      created_at: new Date().toISOString(),
      profiles: {
        username: '官方预设',
        avatar_url: null
      },
      _rawContent: data.content,
      _rawCommitMsg: data.commit_message
    }
  } catch (err) {
    console.error('Error reading preset file', id, err)
    return null
  }
}
