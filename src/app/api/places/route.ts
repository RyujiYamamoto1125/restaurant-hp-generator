import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url') || ''
  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  // Google Maps URLからplace_idを抽出
  const placeIdMatch = url.match(/place_id[=:]([^&/]+)/)
  const cidMatch = url.match(/cid=(\d+)/)

  if (!apiKey || (!placeIdMatch && !cidMatch)) {
    return NextResponse.json({ error: 'Google Places API keyまたはURLが無効です' }, { status: 400 })
  }

  try {
    const placeId = placeIdMatch?.[1]
    const fields = 'name,formatted_address,formatted_phone_number,opening_hours,rating,price_level,editorial_summary,photos,website,types'
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&language=ja&key=${apiKey}`
    )
    const data = await res.json()
    const p = data.result

    return NextResponse.json({
      name: p.name || '',
      address: p.formatted_address || '',
      phone: p.formatted_phone_number || '',
      hours: p.opening_hours?.weekday_text?.join('\n') || '',
      description: p.editorial_summary?.overview || '',
      cuisine: p.types?.find((t: string) => t.includes('food') || t.includes('restaurant')) || '',
    })
  } catch {
    return NextResponse.json({ error: 'Places API取得失敗' }, { status: 500 })
  }
}
