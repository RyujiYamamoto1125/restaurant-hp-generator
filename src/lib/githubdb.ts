// GitHub API をデータベースとして使用
// restaurants/{slug}.json に店舗データを保存

const OWNER = 'RyujiYamamoto1125'
const REPO  = 'restaurant-hp-data'
const BRANCH = 'main'

function headers() {
  return {
    'Authorization': `Bearer ${process.env.GITHUB_DB_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/vnd.github.v3+json',
  }
}

function apiUrl(path: string) {
  return `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`
}

// ── 読み込み ──
export async function getRestaurant(slug: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(apiUrl(`restaurants/${slug}.json?ref=${BRANCH}`), { headers: headers() })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub read error: ${res.status}`)
  const data = await res.json()
  const json = Buffer.from(data.content, 'base64').toString('utf-8')
  return JSON.parse(json)
}

// ── 一覧取得 ──
export async function listRestaurants(): Promise<Record<string, unknown>[]> {
  const res = await fetch(apiUrl(`restaurants?ref=${BRANCH}`), { headers: headers() })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`GitHub list error: ${res.status}`)
  const files: Array<{ name: string }> = await res.json()
  const slugs = files.filter(f => f.name.endsWith('.json')).map(f => f.name.replace('.json', ''))
  const results = await Promise.all(slugs.map(slug => getRestaurant(slug).catch(() => null)))
  return results.filter(Boolean) as Record<string, unknown>[]
}

// ── 保存（新規・更新共通）──
export async function saveRestaurant(slug: string, data: Record<string, unknown>): Promise<void> {
  const path = `restaurants/${slug}.json`
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64')

  // 既存ファイルのSHAを取得（更新時に必要）
  let sha: string | undefined
  const existing = await fetch(apiUrl(path + `?ref=${BRANCH}`), { headers: headers() })
  if (existing.ok) {
    const ex = await existing.json()
    sha = ex.sha
  }

  const body: Record<string, unknown> = {
    message: sha ? `update: ${slug}` : `create: ${slug}`,
    content,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`GitHub write error: ${res.status} - ${JSON.stringify(err)}`)
  }
}

// ── 画像アップロード ──
export async function uploadImage(slug: string, filename: string, buffer: Buffer, mimeType: string): Promise<string> {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg'
  const path = `images/${slug}/${Date.now()}-${filename}.${ext}`
  const content = buffer.toString('base64')

  const res = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({
      message: `upload image: ${slug}`,
      content,
      branch: BRANCH,
    }),
  })
  if (!res.ok) throw new Error(`GitHub image upload error: ${res.status}`)

  // jsDelivr CDN経由で配信（GitHubの直リンクより高速）
  return `https://cdn.jsdelivr.net/gh/${OWNER}/${REPO}@${BRANCH}/${path}`
}
