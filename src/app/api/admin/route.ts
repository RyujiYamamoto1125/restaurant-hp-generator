import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

// 環境変数 ADMIN_KEY で保護
function checkAdmin(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey')
  return key === process.env.ADMIN_KEY
}

// GET: 全HP一覧
export async function GET(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  await connectDB()
  const list = await Restaurant.find({}, { slug:1, name:1, cuisine:1, status:1, createdAt:1, phone:1, address:1 })
    .sort({ createdAt: -1 }).lean()
  return NextResponse.json(list)
}

// PATCH: ステータス変更 { slug, status: 'active'|'demo'|'inactive' }
export async function PATCH(req: NextRequest) {
  if (!checkAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { slug, status } = await req.json()
  if (!['demo', 'active', 'inactive'].includes(status)) {
    return NextResponse.json({ error: 'invalid status' }, { status: 400 })
  }
  await connectDB()
  const r = await Restaurant.findOneAndUpdate({ slug }, { status }, { new: true })
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ ok: true, slug: r.slug, status: r.status })
}
