import { NextRequest, NextResponse } from 'next/server'
import { listRestaurants, getRestaurant, saveRestaurant } from '@/lib/githubdb'

function checkAdmin(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('adminKey') || ''
  return process.env.ADMIN_KEY && key === process.env.ADMIN_KEY
}

export async function GET(req: NextRequest) {
  try {
    if (!checkAdmin(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const list = await listRestaurants()
    return NextResponse.json(list.map(r => ({
      slug: r.slug, name: r.name, cuisine: r.cuisine,
      status: r.status, createdAt: r.createdAt, phone: r.phone, address: r.address,
    })))
  } catch (e) {
    console.error('GET admin:', e)
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
    const r = await getRestaurant(slug)
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    await saveRestaurant(slug, { ...r, status })
    return NextResponse.json({ ok: true, slug, status })
  } catch (e) {
    console.error('PATCH admin:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
