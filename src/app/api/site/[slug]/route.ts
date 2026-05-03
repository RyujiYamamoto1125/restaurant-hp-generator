import { NextRequest, NextResponse } from 'next/server'
import { getRestaurant, saveRestaurant } from '@/lib/githubdb'
import { buildHtml, RestaurantContent, RestaurantMeta } from '@/lib/template'

type Params = { params: Promise<{ slug: string }> }

function getToken(req: NextRequest) {
  return req.headers.get('x-edit-token') || req.nextUrl.searchParams.get('token') || ''
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params
    const r = await getRestaurant(slug)
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
    console.error('GET site:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params
    const r = await getRestaurant(slug)
    if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (r.editToken !== getToken(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await req.json()
    const content: RestaurantContent = body.content
    const basic = body.basic || {}
    const uploads = body.uploads || {}

    const updated = { ...r }
    if (basic.name)       updated.name = basic.name
    if (basic.phone)      updated.phone = basic.phone
    if (basic.hours)      updated.hours = basic.hours
    if (basic.address)    updated.address = basic.address
    if (basic.priceRange) updated.priceRange = basic.priceRange
    if (basic.seats)      updated.seats = basic.seats

    if (uploads.heroImg !== undefined)     updated.uploadedHeroImg = uploads.heroImg
    if (uploads.menuImgs !== undefined)    updated.uploadedMenuImgs = uploads.menuImgs
    if (uploads.galleryImgs !== undefined) updated.uploadedGalleryImgs = uploads.galleryImgs

    updated.contentJson = JSON.stringify(content)

    let base: RestaurantMeta
    try { base = updated.metaJson ? JSON.parse(updated.metaJson as string) : null }
    catch { base = null as unknown as RestaurantMeta }

    if (!base) {
      base = {
        name: updated.name as string, cuisine: updated.cuisine as string,
        address: updated.address as string, phone: updated.phone as string,
        hours: updated.hours as string, priceRange: updated.priceRange as string,
        seats: updated.seats as string, access: updated.access as string || '',
        rating: updated.rating as string || '', tabelogUrl: updated.tabelogUrl as string || '',
        googleMapsUrl: updated.googleMapsUrl as string || '',
        heroImgSrc: '', galleryImgSrcs: [], menuImgSrcs: [], mapsEmbedSrc: '',
      }
    }

    base.name = updated.name as string; base.phone = updated.phone as string
    base.hours = updated.hours as string; base.address = updated.address as string
    base.priceRange = updated.priceRange as string; base.seats = updated.seats as string
    if (base.address) base.mapsEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(base.address)}&output=embed&hl=ja`

    const heroImg = updated.uploadedHeroImg as string
    const menuImgs = updated.uploadedMenuImgs as string[]
    const galleryImgs = updated.uploadedGalleryImgs as string[]

    if (heroImg) base.heroImgSrc = heroImg
    if (menuImgs?.length) base.menuImgSrcs = base.menuImgSrcs.map((s, i) => menuImgs[i] || s)
    if (galleryImgs?.length) base.galleryImgSrcs = [...galleryImgs, ...base.galleryImgSrcs.filter(s => !galleryImgs.includes(s))].slice(0, 6)

    updated.metaJson = JSON.stringify(base)
    updated.generatedHtml = buildHtml(base, content)

    await saveRestaurant(slug, updated)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('PATCH site:', e)
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 })
  }
}
