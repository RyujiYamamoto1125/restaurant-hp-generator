import { getRestaurant } from '@/lib/githubdb'
import { notFound } from 'next/navigation'
import { injectWatermark } from '@/lib/watermark'

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const decodedSlug = decodeURIComponent(slug)
  const restaurant = await getRestaurant(decodedSlug)

  if (!restaurant) notFound()

  if (restaurant.status === 'inactive') {
    return (
      <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#1a1a2e', fontFamily:'sans-serif' }}>
        <div style={{ textAlign:'center', color:'#fff', padding:'2rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔒</div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:700 }}>このページは現在非公開です</h1>
        </div>
      </div>
    )
  }

  const html = restaurant.status === 'demo'
    ? injectWatermark(restaurant.generatedHtml as string, restaurant.name as string)
    : restaurant.generatedHtml as string

  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
