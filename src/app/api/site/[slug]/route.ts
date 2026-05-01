import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import { buildHtml, RestaurantContent, RestaurantMeta } from '@/lib/template'

type Params = { params: Promise<{ slug: string }> }

function getToken(req: NextRequest) {
  return req.headers.get('x-edit-token') || req.nextUrl.searchParams.get('token') || ''
}

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params
  await connectDB()
  const r = await Restaurant.findOne({ slug }).lean() as any
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (r.editToken !== getToken(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  return NextResponse.json({
    name: r.name, cuisine: r.cuisine, address: r.address,
    phone: r.phone, hours: r.hours, priceRange: r.priceRange, seats: r.seats,
    content: r.contentJson ? JSON.parse(r.contentJson) : null,
    uploadedHeroImg: r.uploadedHeroImg || '',
    uploadedMenuImgs: r.uploadedMenuImgs || [],
    uploadedGalleryImgs: r.uploadedGalleryImgs || [],
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { slug } = await params
  await connectDB()
  const r = await Restaurant.findOne({ slug }) as any
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

  if (uploads.heroImg !== undefined)    r.uploadedHeroImg = uploads.heroImg
  if (uploads.menuImgs !== undefined)   r.uploadedMenuImgs = uploads.menuImgs
  if (uploads.galleryImgs !== undefined) r.uploadedGalleryImgs = uploads.galleryImgs

  r.contentJson = JSON.stringify(content)

  const base: RestaurantMeta = r.metaJson ? JSON.parse(r.metaJson) : {
    name:'', cuisine:'', address:'', phone:'', hours:'', priceRange:'', seats:'',
    access:'', rating:'', tabelogUrl:'', googleMapsUrl:'',
    heroImgSrc:'', galleryImgSrcs:[], menuImgSrcs:[], mapsEmbedSrc:'',
  }
  base.name = r.name; base.phone = r.phone; base.hours = r.hours
  base.address = r.address; base.priceRange = r.priceRange; base.seats = r.seats
  if (base.address) base.mapsEmbedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(base.address)}&output=embed&hl=ja`

  // アップロード画像を優先してメタに反映
  if (r.uploadedHeroImg) base.heroImgSrc = r.uploadedHeroImg
  if (r.uploadedMenuImgs?.length) {
    base.menuImgSrcs = base.menuImgSrcs.map((s: string, i: number) => r.uploadedMenuImgs[i] || s)
  }
  if (r.uploadedGalleryImgs?.length) {
    base.galleryImgSrcs = [...r.uploadedGalleryImgs, ...base.galleryImgSrcs.filter((s: string) => !r.uploadedGalleryImgs.includes(s))].slice(0, 6)
  }

  r.metaJson = JSON.stringify(base)
  r.generatedHtml = buildHtml(base, content)
  await r.save()

  return NextResponse.json({ ok: true })
}
