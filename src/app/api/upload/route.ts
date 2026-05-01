import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  const slug  = req.nextUrl.searchParams.get('slug') || ''
  const token = req.nextUrl.searchParams.get('token') || ''

  await connectDB()
  const r = await Restaurant.findOne({ slug }).lean() as any
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (r.editToken !== token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: '対応形式: JPG, PNG, WebP' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '10MB以下のファイルを選択してください' }, { status: 400 })

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const dir = join(process.cwd(), 'public', 'uploads', slug)
  await mkdir(dir, { recursive: true })
  await writeFile(join(dir, filename), buffer)

  const url = `/uploads/${slug}/${filename}`
  return NextResponse.json({ url })
}
