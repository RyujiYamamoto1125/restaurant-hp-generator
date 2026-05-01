import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import { hashPassword } from '@/lib/password'

type Params = { params: Promise<{ slug: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { slug } = await params
  const { password } = await req.json()

  await connectDB()
  const r = await Restaurant.findOne({ slug }).lean() as any
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const hash = hashPassword(password, r.editToken)
  if (hash !== r.editPasswordHash) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 })
  }

  return NextResponse.json({ token: r.editToken })
}
