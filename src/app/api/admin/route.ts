import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

function checkAdmin(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey') || ''
  const adminKey = process.env.ADMIN_KEY
  return adminKey && key === adminKey
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    await connectDB()
    const list = await Restaurant.find({}, {
      slug:1, name:1, cuisine:1, status:1, createdAt:1, phone:1, address:1
    }).sort({ createdAt: -1 }).lean()
    return NextResponse.json(list)
  } catch (e) {
    console.error('GET /admin:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const body = await req.json()
    const { slug, status } = body
    if (!slug || !['demo', 'active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'invalid parameters' }, { status: 400 })
    }
    await connectDB()
    const r = await Restaurant.findOneAndUpdate({ slug }, { status }, { new: true })
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, slug: r.slug, status: r.status })
  } catch (e) {
    console.error('PATCH /admin:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
