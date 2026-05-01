'use client'

import { useEffect, useRef, useState } from 'react'

interface MenuItem { name: string; desc: string; price: string; badge: string; imgKeyword: string }
interface Pillar   { icon: string; title: string; text: string }
interface Content  {
  tagline: string; conceptTitle: string; conceptText: string
  pillars: Pillar[]; menu: MenuItem[]
  colorPrimary: string; colorAccent: string; colorBg: string; colorText: string
  fontHeading: string; fontBody: string
}
interface Basic { name: string; phone: string; hours: string; address: string; priceRange: string; seats: string }

const s = {
  input: { width:'100%', padding:'.65rem .9rem', border:'1px solid #ddd', borderRadius:'.5rem', fontSize:'.95rem', fontFamily:'inherit', outline:'none', background:'#fff' } as React.CSSProperties,
  label: { display:'block', fontSize:'.78rem', fontWeight:700, color:'#555', marginBottom:'.3rem', letterSpacing:'.02em' } as React.CSSProperties,
  field: { marginBottom:'1.25rem' } as React.CSSProperties,
  card: { background:'#f8f9fa', borderRadius:'.75rem', padding:'1.25rem', marginBottom:'1rem', border:'1px solid #eee' } as React.CSSProperties,
}

function ImageUploader({ label, current, slug, token, onUploaded }: {
  label: string; current: string; slug: string; token: string
  onUploaded: (url: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(current)

  const upload = async (file: File) => {
    setUploading(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`/api/upload?slug=${slug}&token=${token}`, { method:'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (data.url) { setPreview(data.url); onUploaded(data.url) }
    else alert(data.error || 'アップロード失敗')
  }

  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      <div
        style={{ border:'2px dashed #ddd', borderRadius:'.75rem', overflow:'hidden', cursor:'pointer', position:'relative', minHeight:'120px', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center' }}
        onClick={() => ref.current?.click()}
        onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#e94560' }}
        onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#ddd' }}
        onDrop={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = '#ddd'; const f = e.dataTransfer.files[0]; if (f) upload(f) }}
      >
        {preview
          ? <img src={preview} alt="" style={{ width:'100%', height:'160px', objectFit:'cover', display:'block' }} />
          : <div style={{ textAlign:'center', color:'#aaa', padding:'2rem' }}>
              <div style={{ fontSize:'2rem', marginBottom:'.5rem' }}>📷</div>
              <div style={{ fontSize:'.85rem' }}>クリックまたはドラッグで写真をアップロード</div>
            </div>
        }
        {uploading && (
          <div style={{ position:'absolute', inset:0, background:'rgba(255,255,255,0.8)', display:'grid', placeItems:'center' }}>
            <span style={{ color:'#e94560', fontWeight:700 }}>アップロード中...</span>
          </div>
        )}
        {preview && (
          <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.5)', color:'#fff', fontSize:'.75rem', padding:'.4rem', textAlign:'center' }}>
            クリックで変更
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display:'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}

export default function EditClient({ slug }: { slug: string }) {
  const [token, setToken]     = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [pwInput, setPwInput] = useState('')
  const [loginErr, setLoginErr] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const [loading, setLoading]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [content, setContent]   = useState<Content | null>(null)
  const [basic, setBasic]       = useState<Basic>({ name:'', phone:'', hours:'', address:'', priceRange:'', seats:'' })
  const [heroImg, setHeroImg]   = useState('')
  const [menuImgs, setMenuImgs] = useState<string[]>(Array(6).fill(''))
  const [galleryImgs, setGalleryImgs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'basic'|'concept'|'menu'|'photos'|'design'>('basic')

  // セッションからtokenを復元
  useEffect(() => {
    const saved = sessionStorage.getItem(`edit-token-${slug}`)
    if (saved) { setToken(saved); setLoggedIn(true) }
  }, [slug])

  // データ読み込み
  useEffect(() => {
    if (!loggedIn || !token) return
    setLoading(true)
    fetch(`/api/site/${slug}?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setLoggedIn(false); return }
        setBasic({ name: data.name||'', phone: data.phone||'', hours: data.hours||'', address: data.address||'', priceRange: data.priceRange||'', seats: data.seats||'' })
        setContent(data.content)
        setHeroImg(data.uploadedHeroImg || '')
        setMenuImgs(data.uploadedMenuImgs?.length ? [...data.uploadedMenuImgs, ...Array(6).fill('')].slice(0,6) : Array(6).fill(''))
        setGalleryImgs(data.uploadedGalleryImgs || [])
        setLoading(false)
      })
  }, [loggedIn, token, slug])

  const login = async () => {
    setLoginLoading(true); setLoginErr('')
    const res = await fetch(`/api/site/${slug}/auth`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ password: pwInput }),
    })
    const data = await res.json()
    setLoginLoading(false)
    if (data.token) {
      sessionStorage.setItem(`edit-token-${slug}`, data.token)
      setToken(data.token); setLoggedIn(true)
    } else {
      setLoginErr(data.error || 'ログインに失敗しました')
    }
  }

  const save = async () => {
    if (!content) return
    setSaving(true); setSaved(false)
    const res = await fetch(`/api/site/${slug}?token=${token}`, {
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        content, basic,
        uploads: { heroImg, menuImgs, galleryImgs },
      }),
    })
    setSaving(false)
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const updateMenu = (i: number, f: keyof MenuItem, v: string) => {
    if (!content) return
    const menu = [...content.menu]; menu[i] = { ...menu[i], [f]: v }
    setContent({ ...content, menu })
  }
  const updatePillar = (i: number, f: keyof Pillar, v: string) => {
    if (!content) return
    const pillars = [...content.pillars]; pillars[i] = { ...pillars[i], [f]: v }
    setContent({ ...content, pillars })
  }

  // ──── ログイン画面 ────
  if (!loggedIn) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1a1a2e,#16213e)', display:'grid', placeItems:'center', fontFamily:'sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:'1.5rem', padding:'3rem 2.5rem', width:'100%', maxWidth:'400px', boxShadow:'0 24px 64px rgba(0,0,0,0.3)', margin:'1rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'.75rem' }}>🔐</div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:700, color:'#1a1a2e', marginBottom:'.4rem' }}>HP編集ログイン</h1>
          <p style={{ color:'#888', fontSize:'.9rem' }}>{slug}</p>
        </div>
        <div style={s.field}>
          <label style={s.label}>パスワード</label>
          <input type="password" value={pwInput} onChange={e => setPwInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="管理者から受け取ったパスワード"
            style={{ ...s.input, fontSize:'1.1rem', letterSpacing:'.1em' }} />
        </div>
        {loginErr && <p style={{ color:'#e74c3c', fontSize:'.85rem', marginBottom:'1rem', textAlign:'center' }}>{loginErr}</p>}
        <button onClick={login} disabled={loginLoading || !pwInput} style={{
          width:'100%', background:'#1a1a2e', color:'#fff', border:'none',
          padding:'.9rem', borderRadius:'.75rem', fontWeight:700, fontSize:'1rem',
          cursor:'pointer', opacity: loginLoading || !pwInput ? 0.6 : 1,
        }}>
          {loginLoading ? 'ログイン中...' : 'ログイン'}
        </button>
        <p style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'.8rem', color:'#aaa' }}>
          パスワードはHP制作時に発行されます
        </p>
      </div>
    </div>
  )

  if (loading || !content) return (
    <div style={{ minHeight:'100vh', display:'grid', placeItems:'center', background:'#f0f4f8' }}>
      <p style={{ color:'#888' }}>読み込み中...</p>
    </div>
  )

  const tabs = [
    { id:'basic', label:'📋 基本情報' }, { id:'concept', label:'✏️ コンセプト' },
    { id:'menu',  label:'🍽 メニュー' }, { id:'photos', label:'📷 写真管理' },
    { id:'design',label:'🎨 デザイン' },
  ] as const

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4f8', fontFamily:'sans-serif' }}>
      {/* ヘッダー */}
      <header style={{ background:'#1a1a2e', color:'#fff', padding:'0 5%', height:'64px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, boxShadow:'0 2px 12px rgba(0,0,0,0.3)' }}>
        <div>
          <span style={{ fontWeight:700, fontSize:'1.05rem' }}>✏️ HP編集</span>
          <span style={{ marginLeft:'1rem', color:'rgba(255,255,255,0.5)', fontSize:'.82rem' }}>{basic.name}</span>
        </div>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <a href={`/site/${slug}`} target="_blank" style={{ color:'rgba(255,255,255,0.7)', fontSize:'.85rem', textDecoration:'none' }}>👁 プレビュー</a>
          <button onClick={save} disabled={saving} style={{
            background: saved ? '#27ae60' : '#e94560', color:'#fff', border:'none',
            padding:'.6rem 1.4rem', borderRadius:'2rem', fontWeight:700, fontSize:'.9rem', cursor:'pointer',
          }}>
            {saving ? '保存中...' : saved ? '✓ 保存済み' : '💾 保存する'}
          </button>
        </div>
      </header>

      <div style={{ maxWidth:'960px', margin:'2rem auto', padding:'0 1rem' }}>
        {/* タブ */}
        <div style={{ display:'flex', gap:'.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding:'.55rem 1.1rem', borderRadius:'2rem', border:'none', cursor:'pointer',
              fontWeight:600, fontSize:'.88rem',
              background: activeTab === t.id ? '#1a1a2e' : '#fff',
              color: activeTab === t.id ? '#fff' : '#666',
              boxShadow: activeTab === t.id ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.08)',
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ background:'#fff', borderRadius:'1rem', padding:'2rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>

          {/* 基本情報 */}
          {activeTab === 'basic' && (
            <div>
              <h2 style={{ marginBottom:'1.5rem', color:'#1a1a2e', fontSize:'1.2rem' }}>基本情報</h2>
              {([
                { key:'name', label:'店名', type:'text' },
                { key:'phone', label:'電話番号', type:'tel' },
                { key:'address', label:'住所', type:'text' },
                { key:'hours', label:'営業時間', type:'textarea' },
                { key:'priceRange', label:'価格帯', type:'text' },
                { key:'seats', label:'席数', type:'text' },
              ] as const).map(f => (
                <div key={f.key} style={s.field}>
                  <label style={s.label}>{f.label}</label>
                  {f.type === 'textarea'
                    ? <textarea value={basic[f.key]} onChange={e => setBasic({...basic,[f.key]:e.target.value})}
                        rows={3} style={{...s.input, resize:'vertical'}} />
                    : <input type={f.type} value={basic[f.key]} onChange={e => setBasic({...basic,[f.key]:e.target.value})} style={s.input} />
                  }
                </div>
              ))}
            </div>
          )}

          {/* コンセプト */}
          {activeTab === 'concept' && (
            <div>
              <h2 style={{ marginBottom:'1.5rem', color:'#1a1a2e', fontSize:'1.2rem' }}>コンセプト・こだわり</h2>
              <div style={s.field}><label style={s.label}>キャッチコピー</label><input value={content.tagline} onChange={e => setContent({...content,tagline:e.target.value})} style={s.input}/></div>
              <div style={s.field}><label style={s.label}>コンセプト見出し</label><input value={content.conceptTitle} onChange={e => setContent({...content,conceptTitle:e.target.value})} style={s.input}/></div>
              <div style={s.field}><label style={s.label}>コンセプト本文</label><textarea value={content.conceptText} onChange={e => setContent({...content,conceptText:e.target.value})} rows={5} style={{...s.input,resize:'vertical'}}/></div>
              <h3 style={{ margin:'1.5rem 0 1rem', fontSize:'.95rem', color:'#333' }}>こだわり3ポイント</h3>
              {content.pillars.map((p, i) => (
                <div key={i} style={s.card}>
                  <div style={{ display:'grid', gridTemplateColumns:'56px 1fr', gap:'.75rem', marginBottom:'.75rem' }}>
                    <div><label style={s.label}>アイコン</label><input value={p.icon} onChange={e => updatePillar(i,'icon',e.target.value)} style={{...s.input,textAlign:'center',fontSize:'1.4rem'}}/></div>
                    <div><label style={s.label}>タイトル</label><input value={p.title} onChange={e => updatePillar(i,'title',e.target.value)} style={s.input}/></div>
                  </div>
                  <label style={s.label}>説明文</label>
                  <textarea value={p.text} onChange={e => updatePillar(i,'text',e.target.value)} rows={2} style={{...s.input,resize:'vertical'}}/>
                </div>
              ))}
            </div>
          )}

          {/* メニュー */}
          {activeTab === 'menu' && (
            <div>
              <h2 style={{ marginBottom:'1.5rem', color:'#1a1a2e', fontSize:'1.2rem' }}>メニュー編集</h2>
              {content.menu.map((item, i) => (
                <div key={i} style={s.card}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                    <span style={{ fontWeight:700, color:'#1a1a2e' }}>メニュー {i+1}</span>
                    <input value={item.badge} onChange={e => updateMenu(i,'badge',e.target.value)} style={{...s.input,width:'130px',fontSize:'.8rem',textAlign:'center'}} placeholder="バッジ"/>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:'.75rem', marginBottom:'.75rem' }}>
                    <div><label style={s.label}>料理名</label><input value={item.name} onChange={e => updateMenu(i,'name',e.target.value)} style={s.input}/></div>
                    <div><label style={s.label}>価格（税込）</label><input value={item.price} onChange={e => updateMenu(i,'price',e.target.value)} style={s.input} placeholder="3500"/></div>
                  </div>
                  <label style={s.label}>説明文</label>
                  <textarea value={item.desc} onChange={e => updateMenu(i,'desc',e.target.value)} rows={2} style={{...s.input,resize:'vertical'}}/>
                </div>
              ))}
            </div>
          )}

          {/* 写真管理 */}
          {activeTab === 'photos' && (
            <div>
              <h2 style={{ marginBottom:'.5rem', color:'#1a1a2e', fontSize:'1.2rem' }}>写真のアップロード</h2>
              <p style={{ color:'#888', fontSize:'.85rem', marginBottom:'1.5rem' }}>
                アップロードした写真はHPに即反映されます。JPG・PNG・WebP対応、各10MB以下。
              </p>

              <h3 style={{ fontWeight:700, color:'#333', marginBottom:'1rem', fontSize:'1rem' }}>🌟 トップ（ヒーロー）画像</h3>
              <ImageUploader label="ファーストビューのメイン写真" current={heroImg} slug={slug} token={token} onUploaded={setHeroImg}/>

              <h3 style={{ fontWeight:700, color:'#333', margin:'1.5rem 0 1rem', fontSize:'1rem' }}>🍽 メニュー写真（6品分）</h3>
              {content.menu.map((item, i) => (
                <div key={i} style={{ marginBottom:'1rem' }}>
                  <ImageUploader
                    label={`メニュー${i+1}「${item.name || '未設定'}」の写真`}
                    current={menuImgs[i] || ''}
                    slug={slug} token={token}
                    onUploaded={url => { const a=[...menuImgs]; a[i]=url; setMenuImgs(a) }}
                  />
                </div>
              ))}

              <h3 style={{ fontWeight:700, color:'#333', margin:'1.5rem 0 1rem', fontSize:'1rem' }}>🖼 ギャラリー追加写真</h3>
              <p style={{ color:'#aaa', fontSize:'.8rem', marginBottom:'1rem' }}>食べログから取得した写真に加えて、追加でアップロードできます</p>
              {[0,1,2].map(i => (
                <div key={i} style={{ marginBottom:'1rem' }}>
                  <ImageUploader
                    label={`ギャラリー追加写真 ${i+1}`}
                    current={galleryImgs[i] || ''}
                    slug={slug} token={token}
                    onUploaded={url => { const a=[...galleryImgs]; a[i]=url; setGalleryImgs(a) }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* デザイン */}
          {activeTab === 'design' && (
            <div>
              <h2 style={{ marginBottom:'1.5rem', color:'#1a1a2e', fontSize:'1.2rem' }}>カラー・フォント</h2>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
                {([
                  { key:'colorPrimary', label:'メインカラー' },
                  { key:'colorAccent',  label:'アクセントカラー' },
                  { key:'colorBg',      label:'背景色' },
                  { key:'colorText',    label:'テキスト色' },
                ] as const).map(c => (
                  <div key={c.key} style={s.field}>
                    <label style={s.label}>{c.label}</label>
                    <div style={{ display:'flex', gap:'.5rem', alignItems:'center' }}>
                      <input type="color" value={content[c.key]} onChange={e => setContent({...content,[c.key]:e.target.value})}
                        style={{ width:'44px', height:'40px', border:'1px solid #ddd', borderRadius:'.4rem', cursor:'pointer', padding:'2px', flexShrink:0 }}/>
                      <input value={content[c.key]} onChange={e => setContent({...content,[c.key]:e.target.value})}
                        style={{...s.input,fontFamily:'monospace'}}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background:content.colorBg, padding:'1.5rem', borderRadius:'.75rem', border:'1px solid #eee' }}>
                <div style={{ color:content.colorPrimary, fontWeight:700, fontSize:'1.2rem', marginBottom:'.4rem' }}>プレビュー: {basic.name}</div>
                <div style={{ color:content.colorText, fontSize:'.9rem', marginBottom:'1rem' }}>キャッチコピーのサンプルテキストです</div>
                <span style={{ background:content.colorAccent, color:'#fff', padding:'.4rem 1rem', borderRadius:'2rem', fontSize:'.85rem', fontWeight:600 }}>ボタン</span>
              </div>
            </div>
          )}
        </div>

        {/* 保存ボタン */}
        <div style={{ textAlign:'center', padding:'2rem 0' }}>
          <button onClick={save} disabled={saving} style={{
            background: saved ? '#27ae60' : '#e94560', color:'#fff', border:'none',
            padding:'1rem 3rem', borderRadius:'3rem', fontWeight:700, fontSize:'1.05rem',
            cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.2)',
          }}>
            {saving ? '保存中...' : saved ? '✓ HPに反映されました！' : '💾 変更を保存してHPに反映'}
          </button>
          <p style={{ color:'#aaa', fontSize:'.8rem', marginTop:'.75rem' }}>保存するとすぐにHPに反映されます</p>
        </div>
      </div>
    </div>
  )
}
