import EditClient from './EditClient'

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <EditClient slug={slug} />
}
