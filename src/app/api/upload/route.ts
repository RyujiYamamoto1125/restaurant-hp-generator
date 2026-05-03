import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

// SVGを除外（XSSリスク）
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(req: NextRequest) {
  try {
    const slug  = req.nextUrl.searchParams.get('slug') || ''
    const token = req.nextUrl.searchParams.get('token') || ''
    if (!slug || !token) return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })

    await connectDB()
    const r = await Restaurant.findOne({ slug }).lean() as Record<string, string> | null
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (r.editToken !== token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '対応形式: JPG, PNG, WebP（SVG不可）' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '10MB以下のファイルを選択してください' }, { status: 400 })
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `restaurants/${slug}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return NextResponse.json({ url: blob.url })
  } catch (e) {
    console.error('POST /upload:', e)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }
}
