import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'

function toSlug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^\w぀-鿿]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36)
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, cuisine, address, phone, hours, description, priceRange, seats, googleMapsUrl, tabelogUrl } = body

  if (!name) return NextResponse.json({ error: '店名は必須です' }, { status: 400 })

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `
あなたはプロのWebデザイナーです。以下の飲食店情報をもとに、完全なHTMLファイルを1つ生成してください。

【店舗情報】
- 店名: ${name}
- ジャンル: ${cuisine || '不明'}
- 住所: ${address || '未設定'}
- 電話番号: ${phone || '未設定'}
- 営業時間: ${hours || '未設定'}
- 説明: ${description || ''}
- 価格帯: ${priceRange || ''}
- 席数: ${seats || ''}
- Google Maps: ${googleMapsUrl || ''}
- 食べログ: ${tabelogUrl || ''}

【要件】
- 完全なHTMLファイル（<!DOCTYPE html>から</html>まで）
- インラインのTailwind CSS CDN使用
- レスポンシブデザイン（モバイルファースト）
- セクション構成: ヒーロー、特徴/コンセプト、メニュー（架空でOK、ジャンルに合わせて）、営業情報、アクセス、フッター
- Google Mapsが提供されている場合はiframeで埋め込む（src="https://maps.google.com/maps?q=ADDRESS&output=embed"）
- プロフェッショナルな配色（ジャンルに合わせる）
- アニメーションCSSを適度に使用
- 外部フォント（Google Fonts）使用可
- HTMLコード以外は一切出力しないこと

HTMLのみ出力してください。
`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const generatedHtml = (message.content[0] as any).text
    .replace(/^```html\n?/, '')
    .replace(/\n?```$/, '')

  await connectDB()
  const slug = toSlug(name)
  const restaurant = await Restaurant.create({
    slug,
    name,
    cuisine,
    address,
    phone,
    hours,
    description,
    priceRange,
    seats,
    googleMapsUrl,
    tabelogUrl,
    imageUrls: [],
    generatedHtml,
  })

  return NextResponse.json({ slug: restaurant.slug })
}
