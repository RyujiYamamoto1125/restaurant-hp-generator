import { NextRequest, NextResponse } from 'next/server'
import { getRestaurant } from '@/lib/githubdb'
import { hashPassword } from '@/lib/password'

type Params = { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params
    const body = await req.json()
    const password = typeof body.password === 'string' ? body.password.trim() : ''
    if (!password) return NextResponse.json({ error: 'パスワードを入力してください' }, { status: 400 })

    const r = await getRestaurant(slug)
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const hash = hashPassword(password, r.editToken as string)
    if (hash !== r.editPasswordHash) {
      return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 })
    }

    return NextResponse.json({ token: r.editToken })
  } catch (e) {
    console.error('POST auth:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
