import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import { scrapTabelog, scrapeGoogleMaps, ScrapedData } from '@/lib/scraper'
import { buildHtml, RestaurantContent, RestaurantMeta } from '@/lib/template'
import { hashPassword, generatePassword } from '@/lib/password'

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^\w぀-鿿]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36)
}

function proxySrc(url: string) {
  return `/api/image-proxy?url=${encodeURIComponent(url)}`
}

function merge(manual: Record<string, string>, scraped: ScrapedData): Record<string, string> {
  const result: Record<string, string> = { ...manual }
  for (const [key, val] of Object.entries(scraped)) {
    if (key === 'imageUrls') continue
    if (val && !result[key]) result[key] = val as string
  }
  return result
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  let { name, cuisine, address, phone, hours, description, priceRange, seats, googleMapsUrl, tabelogUrl } = body

  // ── スクレイピング ──
  let imageUrls: string[] = []
  let scraped: ScrapedData = {}

  if (tabelogUrl) {
    try {
      const d = await scrapTabelog(tabelogUrl)
      scraped = { ...scraped, ...d }
      if (d.imageUrls?.length) imageUrls = d.imageUrls
    } catch (e) { console.error('Tabelog:', e) }
  }
  if (googleMapsUrl) {
    try {
      const d = await scrapeGoogleMaps(googleMapsUrl)
      for (const [k, v] of Object.entries(d)) {
        if (k === 'imageUrls') { if ((v as string[]).length && !imageUrls.length) imageUrls = v as string[] }
        else if (v && !(scraped as any)[k]) (scraped as any)[k] = v
      }
    } catch (e) { console.error('GMaps:', e) }
  }

  const merged = merge({ name, cuisine, address, phone, hours, description, priceRange, seats }, scraped)
  name        = merged.name || name || ''
  cuisine     = merged.cuisine || cuisine || '飲食店'
  address     = merged.address || address || ''
  phone       = merged.phone || phone || ''
  hours       = merged.hours || hours || ''
  description = merged.description || description || ''
  priceRange  = merged.priceRange || priceRange || ''
  seats       = merged.seats || seats || ''
  const access = (scraped as any).access || ''
  const rating = scraped.rating || ''

  if (!name) return NextResponse.json({ error: '店名を取得できませんでした' }, { status: 400 })

  // ── 画像準備 ──
  const heroImgSrc = imageUrls[0]
    ? proxySrc(imageUrls[0])
    : `https://source.unsplash.com/1920x1080/?${encodeURIComponent(cuisine + ',food,restaurant,japanese')}`

  // ギャラリー: 先頭から6枚
  const galleryImgSrcs = imageUrls.slice(0, 6).map(proxySrc)

  // メニュー用: 食べログ写真を順番に割り当て（6枚、足りなければ後半から再利用）
  const menuImgSrcs = Array.from({ length: 6 }, (_, i) => {
    const url = imageUrls[i] ?? imageUrls[imageUrls.length - 1 - (i % Math.max(imageUrls.length, 1))]
    return url ? proxySrc(url) : ''
  })

  const mapsEmbedSrc = address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=ja`
    : ''

  // ── Claude にコンテンツ(JSON)のみ生成させる ──
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `
飲食店「${name}」（${cuisine}）の公式HPコンテンツをJSONで生成してください。

【店舗情報】
- 店名: ${name}
- ジャンル: ${cuisine}
- 住所: ${address}
- 説明文: ${description}
- 価格帯: ${priceRange}
- 評価: ${rating}

以下のJSON形式で出力してください。コードブロックなし、JSONのみ。

{
  "tagline": "（${cuisine}の魅力を伝える印象的なキャッチコピー・20文字以内）",
  "conceptTitle": "（コンセプトセクションの見出し・15文字以内）",
  "conceptText": "（お店のこだわり・世界観を語る文章・150〜200文字。説明文「${description}」を参考に、魅力的に書く）",
  "pillars": [
    {"icon": "🔥", "title": "こだわり1のタイトル", "text": "説明40〜60文字"},
    {"icon": "🌿", "title": "こだわり2のタイトル", "text": "説明40〜60文字"},
    {"icon": "🏆", "title": "こだわり3のタイトル", "text": "説明40〜60文字"}
  ],
  "menu": [
    {"name": "メニュー名1", "desc": "美味しそうな説明文（40〜60文字）", "price": "数字のみ（例:3500）", "badge": "人気No.1", "imgKeyword": "英語検索ワード（例: eel rice bowl japanese）"},
    {"name": "メニュー名2", "desc": "...", "price": "...", "badge": "おすすめ", "imgKeyword": "..."},
    {"name": "メニュー名3", "desc": "...", "price": "...", "badge": "季節限定", "imgKeyword": "..."},
    {"name": "メニュー名4", "desc": "...", "price": "...", "badge": "定番", "imgKeyword": "..."},
    {"name": "メニュー名5", "desc": "...", "price": "...", "badge": "ランチ", "imgKeyword": "..."},
    {"name": "メニュー名6", "desc": "...", "price": "...", "badge": "コース", "imgKeyword": "..."}
  ],
  "colorPrimary": "（ジャンルに合う濃い色 HEX）",
  "colorAccent": "（映えるアクセント色 HEX）",
  "colorBg": "（背景色 HEX、明るく）",
  "colorText": "（テキスト色 HEX）",
  "fontHeading": "（Google Fontsフォント名、和食ならNoto Serif JP等）",
  "fontBody": "（本文フォント名、Noto Sans JP等）"
}

メニューは${cuisine}の代表的な料理を6品、リアルな料金で。imgKeywordは英語で料理が正しく検索できるワードを指定。JSONのみ出力。
`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  let content: RestaurantContent
  try {
    const raw = (message.content[0] as any).text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    content = JSON.parse(raw)
  } catch {
    // JSON パース失敗時のフォールバック
    content = {
      tagline: `${cuisine}の本格専門店`,
      conceptTitle: 'こだわりの一品を',
      conceptText: description || `${name}は、${cuisine}の専門店として地域の皆様に愛され続けています。厳選された素材と職人の技で、最高の一品をお届けします。`,
      pillars: [
        { icon: '🔥', title: '素材へのこだわり', text: '地元の厳選食材を毎日仕入れ、新鮮な状態でご提供します' },
        { icon: '👨‍🍳', title: '職人の技', text: '長年の経験を持つ職人が、一品一品丁寧に仕上げます' },
        { icon: '🏡', title: 'くつろぎの空間', text: '落ち着いた和の空間で、特別なひとときをお過ごしください' },
      ],
      menu: [
        { name: `${cuisine}定食`, desc: '看板メニュー。旬の素材をふんだんに使った自慢の一品です', price: '1500', badge: '人気No.1', imgKeyword: `${cuisine} japanese food lunch` },
        { name: 'おまかせコース', desc: '季節の食材を使った料理長おすすめのコースです', price: '5000', badge: 'おすすめ', imgKeyword: 'japanese course meal gourmet' },
        { name: '季節の一品', desc: 'その日の仕入れによる季節感あふれる特別料理', price: '2200', badge: '季節限定', imgKeyword: 'seasonal japanese food' },
        { name: 'ランチセット', desc: '平日限定のお得なランチセット。スープ・小鉢付き', price: '980', badge: 'ランチ', imgKeyword: 'japanese lunch set bento' },
        { name: '単品料理', desc: '素材の旨みを活かしたシンプルな定番料理', price: '800', badge: '定番', imgKeyword: 'japanese food single dish' },
        { name: 'お子様プレート', desc: 'お子様にも人気の特別プレート。デザート付き', price: '650', badge: 'お子様', imgKeyword: 'kids meal japanese cute food' },
      ],
      colorPrimary: '#2C1810',
      colorAccent: '#C8922A',
      colorBg: '#FDF8F0',
      colorText: '#3D2B1F',
      fontHeading: 'Noto Serif JP',
      fontBody: 'Noto Sans JP',
    }
  }

  // ── テンプレートにデータ注入してHTML生成 ──
  const meta: RestaurantMeta = {
    name, cuisine, address, phone, hours, priceRange, seats, access, rating,
    tabelogUrl: tabelogUrl || '',
    googleMapsUrl: googleMapsUrl || '',
    heroImgSrc,
    galleryImgSrcs,
    menuImgSrcs,
    mapsEmbedSrc,
  }

  const generatedHtml = buildHtml(meta, content)

  await connectDB()
  const slug = toSlug(name)
  const editToken = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const plainPassword = generatePassword()
  const editPasswordHash = hashPassword(plainPassword, editToken)

  const restaurant = await Restaurant.create({
    slug, editToken, editPasswordHash,
    name, cuisine, address, phone, hours, description,
    priceRange, seats, access, rating, googleMapsUrl, tabelogUrl, imageUrls,
    uploadedHeroImg: '', uploadedMenuImgs: [], uploadedGalleryImgs: [],
    contentJson: JSON.stringify(content),
    metaJson: JSON.stringify(meta),
    generatedHtml,
  })

  return NextResponse.json({ slug: restaurant.slug, password: plainPassword })
}
