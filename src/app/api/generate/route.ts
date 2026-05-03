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
  try {
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
      } catch (e) { console.error('Tabelog scrape error:', e) }
    }
    if (googleMapsUrl) {
      try {
        const d = await scrapeGoogleMaps(googleMapsUrl)
        for (const [k, v] of Object.entries(d)) {
          if (k === 'imageUrls') { if ((v as string[]).length && !imageUrls.length) imageUrls = v as string[] }
          else if (v && !(scraped as Record<string, unknown>)[k]) (scraped as Record<string, unknown>)[k] = v
        }
      } catch (e) { console.error('GMaps scrape error:', e) }
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
    const access = (scraped as Record<string, unknown>).access as string || ''
    const rating = scraped.rating || ''

    if (!name) return NextResponse.json({ error: '店名を取得できませんでした。手動で入力してください。' }, { status: 400 })

    // ── 画像準備 ──
    const heroImgSrc = imageUrls[0]
      ? proxySrc(imageUrls[0])
      : `https://source.unsplash.com/1920x1080/?${encodeURIComponent(cuisine + ',food,restaurant,japanese')}`

    const galleryImgSrcs = imageUrls.slice(0, 6).map(proxySrc)
    const menuImgSrcs = Array.from({ length: 6 }, (_, i) => {
      const u = imageUrls[i] ?? imageUrls[Math.max(0, imageUrls.length - 1 - (i % Math.max(imageUrls.length, 1)))]
      return u ? proxySrc(u) : ''
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
  "conceptText": "（お店のこだわり・世界観を語る文章・150〜200文字）",
  "pillars": [
    {"icon": "🔥", "title": "こだわり1のタイトル", "text": "説明40〜60文字"},
    {"icon": "🌿", "title": "こだわり2のタイトル", "text": "説明40〜60文字"},
    {"icon": "🏆", "title": "こだわり3のタイトル", "text": "説明40〜60文字"}
  ],
  "menu": [
    {"name": "メニュー名1", "desc": "美味しそうな説明文（40〜60文字）", "price": "数字のみ", "badge": "人気No.1", "imgKeyword": "英語検索ワード"},
    {"name": "メニュー名2", "desc": "...", "price": "...", "badge": "おすすめ", "imgKeyword": "..."},
    {"name": "メニュー名3", "desc": "...", "price": "...", "badge": "季節限定", "imgKeyword": "..."},
    {"name": "メニュー名4", "desc": "...", "price": "...", "badge": "定番", "imgKeyword": "..."},
    {"name": "メニュー名5", "desc": "...", "price": "...", "badge": "ランチ", "imgKeyword": "..."},
    {"name": "メニュー名6", "desc": "...", "price": "...", "badge": "コース", "imgKeyword": "..."}
  ],
  "colorPrimary": "HEX",
  "colorAccent": "HEX",
  "colorBg": "HEX",
  "colorText": "HEX",
  "fontHeading": "Google Fontsフォント名",
  "fontBody": "Google Fontsフォント名"
}

メニューは${cuisine}の代表的な料理を6品、リアルな料金で。JSONのみ出力。
`

    let content: RestaurantContent
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      })
      if (!message.content.length) throw new Error('Empty response from Claude')
      const raw = (message.content[0] as { type: string; text: string }).text
        .replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
      content = JSON.parse(raw)
    } catch (e) {
      console.error('Claude/parse error:', e)
      content = {
        tagline: `${cuisine}の本格専門店`,
        conceptTitle: 'こだわりの一品を',
        conceptText: description || `${name}は、${cuisine}の専門店として地域の皆様に愛され続けています。厳選された素材と職人の技で、最高の一品をお届けします。`,
        pillars: [
          { icon: '🔥', title: '素材へのこだわり', text: '地元の厳選食材を毎日仕入れ、新鮮な状態でご提供します' },
          { icon: '👨‍🍳', title: '職人の技', text: '長年の経験を持つ職人が、一品一品丁寧に仕上げます' },
          { icon: '🏡', title: 'くつろぎの空間', text: '落ち着いた空間で、特別なひとときをお過ごしください' },
        ],
        menu: [
          { name: `${cuisine}定食`, desc: '看板メニュー。旬の素材をふんだんに使った自慢の一品', price: '1500', badge: '人気No.1', imgKeyword: `${cuisine} japanese food` },
          { name: 'おまかせコース', desc: '季節の食材を使った料理長おすすめのコース', price: '5000', badge: 'おすすめ', imgKeyword: 'japanese course meal gourmet' },
          { name: '季節の一品', desc: 'その日の仕入れによる季節感あふれる特別料理', price: '2200', badge: '季節限定', imgKeyword: 'seasonal japanese food' },
          { name: 'ランチセット', desc: '平日限定のお得なランチセット。スープ・小鉢付き', price: '980', badge: 'ランチ', imgKeyword: 'japanese lunch set' },
          { name: '単品料理', desc: '素材の旨みを活かしたシンプルな定番料理', price: '800', badge: '定番', imgKeyword: 'japanese food single dish' },
          { name: 'お子様プレート', desc: 'お子様にも人気の特別プレート。デザート付き', price: '650', badge: 'お子様', imgKeyword: 'kids meal japanese' },
        ],
        colorPrimary: '#2C1810', colorAccent: '#C8922A',
        colorBg: '#FDF8F0', colorText: '#3D2B1F',
        fontHeading: 'Noto Serif JP', fontBody: 'Noto Sans JP',
      }
    }

    const meta: RestaurantMeta = {
      name, cuisine, address, phone, hours, priceRange, seats, access, rating,
      tabelogUrl: tabelogUrl || '',
      googleMapsUrl: googleMapsUrl || '',
      heroImgSrc, galleryImgSrcs, menuImgSrcs, mapsEmbedSrc,
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

  } catch (e) {
    console.error('Generate API error:', e)
    const msg = e instanceof Error ? e.message : 'サーバーエラーが発生しました'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
