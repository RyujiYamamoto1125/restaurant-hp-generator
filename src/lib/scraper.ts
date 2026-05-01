import * as cheerio from 'cheerio'

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Referer': 'https://www.google.com/',
}

export interface ScrapedData {
  name?: string
  address?: string
  phone?: string
  hours?: string
  description?: string
  cuisine?: string
  priceRange?: string
  seats?: string
  access?: string
  holiday?: string
  imageUrls?: string[]
  rating?: string
}

export async function scrapTabelog(url: string): Promise<ScrapedData> {
  const res = await fetch(url, { headers: BROWSER_HEADERS })
  if (!res.ok) throw new Error(`Tabelog fetch failed: ${res.status}`)
  const html = await res.text()
  const $ = cheerio.load(html)

  const data: ScrapedData = {}

  // 店名
  data.name =
    $('h2.display-name span').first().text().trim() ||
    $('.rd-header__rst-name-main').text().trim() ||
    $('h2[class*="rst-name"]').text().trim() ||
    $('h1').first().text().trim()

  // 情報テーブル
  $('.rstinfo-table__row').each((_, row) => {
    const label = $(row).find('.rstinfo-table__title').text().trim()
    const val = $(row).find('.rstinfo-table__val').text().trim().replace(/\s+/g, ' ')
    if (/住所|所在地/.test(label)) data.address = val.replace(/地図を見る[\s\S]*/, '').trim()
    if (/電話|TEL/.test(label)) data.phone = val.split(/\s/)[0]
    if (/営業時間/.test(label)) data.hours = val.replace(/営業時間に関して[\s\S]*/, '').trim()
    if (/定休日/.test(label)) data.holiday = val
    if (/予算/.test(label) && !data.priceRange) data.priceRange = val
    if (/席数/.test(label)) data.seats = val
    if (/ジャンル|料理/.test(label)) data.cuisine = val.split(/[、,\s]/)[0]
    if (/交通|アクセス/.test(label)) data.access = val
  })

  if (data.holiday && data.hours) {
    data.hours += `\n定休日: ${data.holiday}`
  }

  // 説明文
  data.description =
    $('.pr-comment__body').text().trim() ||
    $('[class*="pr-comment"]').text().trim() ||
    $('[class*="rstinfo-description"]').text().trim()
  if (data.description && data.description.length > 600) {
    data.description = data.description.slice(0, 600)
  }

  // 評価
  data.rating =
    $('.rdheader-rating__score-val-dtl').first().text().trim() ||
    $('[class*="rating-val"]').first().text().trim()

  // 画像: 640x640_rect サイズのみ取得（高解像度）
  const seen = new Set<string>()
  const imgs: string[] = []

  // HTML全体からtblg.k-img.comの640x640_rect画像を抽出
  const imgRegex = /https:\/\/tblg\.k-img\.com\/[^"'<>\s&]+640x640_rect[^"'<>\s&]*/g
  const matches = html.match(imgRegex) || []
  for (const src of matches) {
    const clean = src.split('?')[0]
    if (!seen.has(clean) && /\.(jpg|jpeg|png|webp)$/i.test(clean) && imgs.length < 8) {
      seen.add(clean)
      imgs.push(clean)
    }
  }

  // 通常のimg srcからも補完
  $('img').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy') || ''
    if (
      src.includes('tblg') &&
      !src.includes('150x150') &&
      !src.includes('icon') &&
      !src.includes('logo') &&
      !seen.has(src) &&
      imgs.length < 8
    ) {
      seen.add(src)
      imgs.push(src.startsWith('//') ? 'https:' + src : src)
    }
  })

  // フォトギャラリーページからさらに取得（メニュー用に最大14枚）
  try {
    const photoPageUrl = url.replace(/\/$/, '') + '/dtlphotolst/'
    const photoRes = await fetch(photoPageUrl, { headers: BROWSER_HEADERS })
    if (photoRes.ok) {
      const photoHtml = await photoRes.text()
      const photoMatches = photoHtml.match(/https:\/\/tblg\.k-img\.com\/[^"'<>\s&]+640x640_rect[^"'<>\s&]*/g) || []
      for (const src of photoMatches) {
        const clean = src.split('?')[0]
        if (!seen.has(clean) && /\.(jpg|jpeg|png|webp)$/i.test(clean) && imgs.length < 14) {
          seen.add(clean)
          imgs.push(clean)
        }
      }
    }
  } catch { /* fallthrough */ }

  data.imageUrls = imgs
  return data
}

export async function scrapeGoogleMaps(url: string): Promise<ScrapedData> {
  let expandedUrl = url
  // 短縮URL展開
  if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
    try {
      const r = await fetch(url, { headers: BROWSER_HEADERS, redirect: 'follow' })
      expandedUrl = r.url
    } catch { /* fallthrough */ }
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  const placeIdMatch = expandedUrl.match(/1s(0x[0-9a-f]+:[0-9a-fx]+)/) ||
    expandedUrl.match(/place_id[=:]([^&/\s]+)/)

  if (apiKey && placeIdMatch) {
    try {
      const fields = 'name,formatted_address,formatted_phone_number,opening_hours,rating,price_level,editorial_summary,types,photos'
      const apiRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeIdMatch[1]}&fields=${fields}&language=ja&key=${apiKey}`
      )
      const json = await apiRes.json()
      const p = json.result
      if (p?.name) {
        const imgs = (p.photos || []).slice(0, 6).map((ph: any) =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ph.photo_reference}&key=${apiKey}`
        )
        return {
          name: p.name,
          address: p.formatted_address,
          phone: p.formatted_phone_number,
          hours: p.opening_hours?.weekday_text?.join('\n'),
          description: p.editorial_summary?.overview,
          priceRange: ['', '〜1,000円', '1,000〜3,000円', '3,000〜5,000円', '10,000円〜'][p.price_level ?? 0],
          rating: p.rating?.toString(),
          imageUrls: imgs,
        }
      }
    } catch { /* fallthrough */ }
  }

  // フォールバック: HTMLからOGP/JSON-LD取得
  try {
    const res = await fetch(expandedUrl, { headers: BROWSER_HEADERS })
    const html = await res.text()
    const $ = cheerio.load(html)
    const data: ScrapedData = {}
    data.name = $('meta[property="og:title"]').attr('content') || $('title').text().split(/[·\-|]/)[0].trim()
    data.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content')
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}')
        if (json.address) {
          const loc = json.address
          data.address = typeof loc === 'string' ? loc :
            [loc.streetAddress, loc.addressLocality, loc.addressRegion].filter(Boolean).join(' ')
        }
        if (json.telephone) data.phone = json.telephone
        if (json.openingHours) data.hours = Array.isArray(json.openingHours) ? json.openingHours.join('\n') : json.openingHours
      } catch { /* skip */ }
    })
    return data
  } catch {
    return {}
  }
}
