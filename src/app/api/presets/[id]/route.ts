import { NextResponse } from 'next/server'
import { getPresetById } from '@/lib/presets'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const p = await params
  const id = p.id
  
  if (!id.startsWith('preset-')) {
    return NextResponse.json({ error: 'Not a preset ID' }, { status: 400 })
  }

  const preset = getPresetById(id)
  
  if (!preset) {
    return NextResponse.json({ error: 'Preset not found' }, { status: 404 })
  }

  return NextResponse.json(preset)
}
