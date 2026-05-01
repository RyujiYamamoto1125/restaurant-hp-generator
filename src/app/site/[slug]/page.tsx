import { connectDB } from '@/lib/mongodb'
import Restaurant from '@/models/Restaurant'
import { notFound } from 'next/navigation'

export default async function SitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  await connectDB()
  const restaurant = await Restaurant.findOne({ slug }).lean() as any

  if (!restaurant) notFound()

  return (
    <div
      dangerouslySetInnerHTML={{ __html: restaurant.generatedHtml }}
    />
  )
}
