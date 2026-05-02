'use client'

import { useState, useEffect } from 'react'

interface Site {
  _id: string; slug: string; name: string; cuisine: string
  status: 'demo' | 'active' | 'inactive'; createdAt: string
  phone: string; address: string
}

const STATUS_LABEL = {
  demo:     { label: 'DEMO', bg: '#f39c12', color: '#fff' },
  active:   { label: '公開中', bg: '#27ae60', color: '#fff' },
  inactive: { label: '非公開', bg: '#95a5a6', color: '#fff' },
}

export default function AdminClient() {
  const [adminKey, setAdminKey] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const login = async () => {
    setLoading(true); setErr('')
    const res = await fetch(`/api/admin?adminKey=${adminKey}`)
    if (res.ok) {
      setSites(await res.json())
      sessionStorage.setItem('admin-key', adminKey)
      setLoggedIn(true)
    } else {
      setErr('管理者キーが違います')
    }
    setLoading(false)
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('admin-key')
    if (saved) { setAdminKey(saved) }
  }, [])

  const changeStatus = async (slug: string, status: Site['status']) => {
    setUpdating(slug)
    await fetch('/api/admin', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ slug, status }),
    })
    setSites(prev => prev.map(s => s.slug === slug ? { ...s, status } : s))
    setUpdating(null)
  }

  const s = {
    input: { padding:'.65rem .9rem', border:'1px solid #ddd', borderRadius:'.5rem', fontSize:'1rem', outline:'none', fontFamily:'inherit' } as React.CSSProperties,
  }

  if (!loggedIn) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a1a2e,#16213e)', display:'grid', placeItems:'center', fontFamily:'sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:'1.5rem', padding:'3rem 2.5rem', width:'100%', maxWidth:'380px', margin:'1rem', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'.5rem' }}>⚙️</div>
          <h1 style={{ fontSize:'1.3rem', fontWeight:700, color:'#1a1a2e' }}>管理者ログイン</h1>
        </div>
        <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="ADMIN_KEY" style={{ ...s.input, width:'100%', marginBottom:'1rem' }} />
        {err && <p style={{ color:'#e74c3c', fontSize:'.85rem', marginBottom:'1rem', textAlign:'center' }}>{err}</p>}
        <button onClick={login} disabled={loading} style={{
          width:'100%', background:'#1a1a2e', color:'#fff', border:'none',
          padding:'.9rem', borderRadius:'.75rem', fontWeight:700, fontSize:'1rem', cursor:'pointer',
        }}>
          {loading ? '確認中...' : 'ログイン'}
        </button>
      </div>
    </div>
  )

  const counts = { demo: sites.filter(s => s.status==='demo').length, active: sites.filter(s => s.status==='active').length, inactive: sites.filter(s => s.status==='inactive').length }

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'sans-serif' }}>
      <header style={{ background:'#1a1a2e', color:'#fff', padding:'1rem 5%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h1 style={{ fontSize:'1.2rem', fontWeight:700 }}>⚙️ 管理者ダッシュボード</h1>
        <span style={{ color:'rgba(255,255,255,.5)', fontSize:'.85rem' }}>全{sites.length}件</span>
      </header>

      <div style={{ maxWidth:'1100px', margin:'2rem auto', padding:'0 1rem' }}>
        {/* サマリー */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'DEMO（営業中）', count: counts.demo, bg:'#fff7e6', border:'#f39c12', color:'#e67e22' },
            { label:'公開中（契約済）', count: counts.active, bg:'#eafaf1', border:'#27ae60', color:'#1e8449' },
            { label:'月額収益（目安）', count: `¥${(counts.active * 5000).toLocaleString()}`, bg:'#eaf4ff', border:'#3498db', color:'#1a6fa8' },
          ].map((c, i) => (
            <div key={i} style={{ background:c.bg, border:`1px solid ${c.border}`, borderRadius:'1rem', padding:'1.25rem' }}>
              <div style={{ fontSize:'.8rem', color:'#888', marginBottom:'.4rem' }}>{c.label}</div>
              <div style={{ fontSize:'2rem', fontWeight:800, color:c.color }}>{c.count}</div>
            </div>
          ))}
        </div>

        {/* HP一覧 */}
        <div style={{ background:'#fff', borderRadius:'1rem', boxShadow:'0 2px 12px rgba(0,0,0,.06)', overflow:'hidden' }}>
          <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid #eee', fontWeight:700, color:'#1a1a2e' }}>
            HP一覧
          </div>
          {sites.map(site => {
            const st = STATUS_LABEL[site.status]
            return (
              <div key={site.slug} style={{ padding:'1rem 1.5rem', borderBottom:'1px solid #f5f5f5', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                {/* ステータスバッジ */}
                <span style={{ background:st.bg, color:st.color, padding:'.25rem .75rem', borderRadius:'2rem', fontSize:'.75rem', fontWeight:700, flexShrink:0 }}>{st.label}</span>

                {/* 店舗情報 */}
                <div style={{ flex:1, minWidth:'180px' }}>
                  <div style={{ fontWeight:700, color:'#1a1a2e', fontSize:'.95rem' }}>{site.name}</div>
                  <div style={{ fontSize:'.78rem', color:'#999', marginTop:'.1rem' }}>{site.cuisine} · {site.address?.slice(0,20)}{site.address?.length > 20 ? '…' : ''}</div>
                </div>

                {/* 操作リンク */}
                <div style={{ display:'flex', gap:'.5rem', flexShrink:0 }}>
                  <a href={`/site/${encodeURIComponent(site.slug)}`} target="_blank"
                    style={{ padding:'.4rem .9rem', borderRadius:'.5rem', border:'1px solid #ddd', color:'#555', textDecoration:'none', fontSize:'.8rem' }}>
                    👁 HP
                  </a>
                </div>

                {/* ステータス切り替え */}
                <div style={{ display:'flex', gap:'.4rem', flexShrink:0 }}>
                  {(['demo','active','inactive'] as const).map(st => (
                    <button key={st} onClick={() => changeStatus(site.slug, st)}
                      disabled={site.status === st || updating === site.slug}
                      style={{
                        padding:'.4rem .8rem', borderRadius:'.5rem', border:'none', cursor:'pointer', fontSize:'.78rem', fontWeight:600,
                        background: site.status === st ? STATUS_LABEL[st].bg : '#f0f0f0',
                        color: site.status === st ? STATUS_LABEL[st].color : '#888',
                        opacity: updating === site.slug ? 0.5 : 1,
                      }}>
                      {STATUS_LABEL[st].label}
                    </button>
                  ))}
                </div>

                <div style={{ fontSize:'.75rem', color:'#bbb', flexShrink:0 }}>
                  {new Date(site.createdAt).toLocaleDateString('ja-JP')}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
