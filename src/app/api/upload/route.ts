import { NextRequest, NextResponse } from 'next/server'
import { getRestaurant, uploadImage } from '@/lib/githubdb'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const slug  = req.nextUrl.searchParams.get('slug') || ''
    const token = req.nextUrl.searchParams.get('token') || ''
    if (!slug || !token) return NextResponse.json({ error: 'パラメータ不足' }, { status: 400 })

    const r = await getRestaurant(slug)
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (r.editToken !== token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'ファイルがありません' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: '対応形式: JPG, PNG, WebP' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: '10MB以下を選択してください' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const url = await uploadImage(slug, file.name, buffer, file.type)
    return NextResponse.json({ url })
  } catch (e) {
    console.error('POST upload:', e)
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 })
  }
}
