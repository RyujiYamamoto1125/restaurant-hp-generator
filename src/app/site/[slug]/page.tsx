import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import { notFound } from 'next/navigation'
import { injectWatermark } from '@/lib/watermark'

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  await connectDB()
  const restaurant = await Restaurant.findOne({ slug: decodedSlug }).lean() as any

  if (!restaurant) notFound()

  // inactive は非公開
  if (restaurant.status === 'inactive') {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#1a1a2e', fontFamily:'sans-serif' }}>
        <div style={{ textAlign:'center', color:'#fff', padding:'2rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔒</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:'.5rem' }}>このページは現在非公開です</h1>
          <p style={{ color:'rgba(255,255,255,.5)', fontSize:'.9rem' }}>お問い合わせは運営者までご連絡ください</p>
        </div>
      </div>
    )
  }

  const html = restaurant.status === 'demo'
    ? injectWatermark(restaurant.generatedHtml, restaurant.name)
    : restaurant.generatedHtml

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
