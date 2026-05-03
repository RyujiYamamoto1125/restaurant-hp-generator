import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import { buildHtml, RestaurantContent, RestaurantMeta } from '@/lib/template'

type Params = { params: Promise<{ slug: string }> }

function getToken(req: NextRequest) {
  return req.headers.get('x-edit-token') || req.nextUrl.searchParams.get('token') || ''
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params
    await connectDB()
    const r = await Restaurant.findOne({ slug }).lean() as Record<string, unknown> | null
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (r.editToken !== getToken(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    let content = null
    try { content = r.contentJson ? JSON.parse(r.contentJson as string) : null } catch { /* ignore */ }

    return NextResponse.json({
      name: r.name, cuisine: r.cuisine, address: r.address,
      phone: r.phone, hours: r.hours, priceRange: r.priceRange, seats: r.seats,
      content,
      uploadedHeroImg: r.uploadedHeroImg || '',
      uploadedMenuImgs: r.uploadedMenuImgs || [],
      uploadedGalleryImgs: r.uploadedGalleryImgs || [],
    })
  } catch (e) {
    console.error('GET /api/site/[slug]:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params
    await connectDB()
    const r = await Restaurant.findOne({ slug }) as (Record<string, unknown> & { save: () => Promise<void> }) | null
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (r.editToken !== getToken(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    const content: RestaurantContent = body.content
    const basic = body.basic || {}
    const uploads = body.uploads || {}

    if (basic.name)       r.name = basic.name
    if (basic.phone)      r.phone = basic.phone
    if (basic.hours)      r.hours = basic.hours
    if (basic.address)    r.address = basic.address
    if (basic.priceRange) r.priceRange = basic.priceRange
    if (basic.seats)      r.seats = basic.seats

    if (uploads.heroImg !== undefined)     r.uploadedHeroImg = uploads.heroImg
    if (uploads.menuImgs !== undefined)    r.uploadedMenuImgs = uploads.menuImgs
    if (uploads.galleryImgs !== undefined) r.uploadedGalleryImgs = uploads.galleryImgs

    r.contentJson = JSON.stringify(content)

    let base: RestaurantMeta
    try {
      base = r.metaJson ? JSON.parse(r.metaJson as string) : null
    } catch { base = null as unknown as RestaurantMeta }

    if (!base) {
      base = {
        name: r.name as string, cuisine: r.cuisine as string, address: r.address as string,
        phone: r.phone as string, hours: r.hours as string,
        priceRange: r.priceRange as string, seats: r.seats as string,
        access: r.access as string || '', rating: r.rating as string || '',
        tabelogUrl: r.tabelogUrl as string || '', googleMapsUrl: r.googleMapsUrl as string || '',
        heroImgSrc: '', galleryImgSrcs: [], menuImgSrcs: [], mapsEmbedSrc: '',
      }
    }

    base.name = r.name as string; base.phone = r.phone as string
    base.hours = r.hours as string; base.address = r.address as string
    base.priceRange = r.priceRange as string; base.seats = r.seats as string
    if (base.address) {
      base.mapsEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(base.address)}&output=embed&hl=ja`
    }

    const uploadedHeroImg = r.uploadedHeroImg as string
    const uploadedMenuImgs = r.uploadedMenuImgs as string[]
    const uploadedGalleryImgs = r.uploadedGalleryImgs as string[]

    if (uploadedHeroImg) base.heroImgSrc = uploadedHeroImg
    if (uploadedMenuImgs?.length) {
      base.menuImgSrcs = base.menuImgSrcs.map((s, i) => uploadedMenuImgs[i] || s)
    }
    if (uploadedGalleryImgs?.length) {
      base.galleryImgSrcs = [...uploadedGalleryImgs, ...base.galleryImgSrcs.filter(s => !uploadedGalleryImgs.includes(s))].slice(0, 6)
    }

    r.metaJson = JSON.stringify(base)
    r.generatedHtml = buildHtml(base, content)
    await r.save()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH /api/site/[slug]:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
