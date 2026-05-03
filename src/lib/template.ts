export interface MenuItemContent {
  name: string; desc: string; price: string; badge: string; imgKeyword: string
}
export interface ConceptPillar {
  icon: string; title: string; text: string
}
export interface RestaurantContent {
  tagline: string; conceptTitle: string; conceptText: string
  pillars: ConceptPillar[]; menu: MenuItemContent[]
  colorPrimary: string; colorAccent: string; colorBg: string; colorText: string
  fontHeading: string; fontBody: string
}
export interface RestaurantMeta {
  name: string; cuisine: string; address: string; phone: string; hours: string
  priceRange: string; seats: string; access: string; rating: string
  tabelogUrl: string; googleMapsUrl: string
  heroImgSrc: string; galleryImgSrcs: string[]; menuImgSrcs: string[]; mapsEmbedSrc: string
}

function esc(s: string): string {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function menuCard(item: MenuItemContent, idx: number, imgSrc?: string): string {
  const photo = imgSrc || `https://source.unsplash.com/600x400/?${encodeURIComponent(item.imgKeyword + ',food')}`
  const fallback = `https://source.unsplash.com/600x400/?${encodeURIComponent(item.imgKeyword + ',japanese,food')}`
  return `
<div class="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 flex flex-col">
  <div class="relative h-52 overflow-hidden">
    <img src="${esc(photo)}" alt="${esc(item.name)}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
         onerror="this.onerror=null;this.src='${esc(fallback)}'">
    <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
    <span class="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full text-white" style="background:var(--accent)">${esc(item.badge)}</span>
  </div>
  <div class="p-5 flex flex-col flex-1">
    <h3 class="text-lg font-bold mb-2 leading-tight" style="color:var(--primary);font-family:var(--font-h)">${esc(item.name)}</h3>
    <p class="text-sm text-gray-500 leading-relaxed flex-1 mb-4">${esc(item.desc)}</p>
    <div class="flex items-baseline gap-1 mt-auto">
      <span class="text-2xl font-bold" style="color:var(--accent);font-family:var(--font-h)">¥${esc(item.price)}</span>
      <span class="text-xs text-gray-400">（税込）</span>
    </div>
  </div>
</div>`
}

function galleryItem(src: string, name: string, idx: number): string {
  return `<div class="gallery-item overflow-hidden rounded-xl cursor-pointer${idx === 0 ? ' col-span-2 row-span-2' : ''}" onclick="openLb('${esc(src)}')">
  <img src="${esc(src)}" alt="${esc(name)}" class="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
       onerror="this.parentElement.style.display='none'">
</div>`
}

export function buildHtml(meta: RestaurantMeta, c: RestaurantContent): string {
  const phoneClean = (meta.phone || '').replace(/[-\s()]/g, '')
  const rating = parseFloat(meta.rating || '0')
  const stars = rating > 0 ? Array.from({length:5},(_,i)=>i < Math.round(rating) ? '★':'☆').join('') : ''

  const galleryHtml = meta.galleryImgSrcs.length
    ? meta.galleryImgSrcs.map((s,i) => galleryItem(s, meta.name, i)).join('\n')
    : `<div class="col-span-3 text-center text-gray-400 py-12">写真準備中</div>`

  const menuHtml = c.menu.map((item,i) => menuCard(item, i, meta.menuImgSrcs[i])).join('\n')

  const mapHtml = meta.mapsEmbedSrc
    ? `<iframe src="${esc(meta.mapsEmbedSrc)}" width="100%" height="100%" style="border:0" allowfullscreen loading="lazy" class="w-full h-full"></iframe>`
    : ''

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.name)} | 公式サイト</title>
<meta name="description" content="${esc(c.tagline)} - ${esc(meta.cuisine)}専門店 ${esc(meta.address)}">
<meta property="og:title" content="${esc(meta.name)} | 公式サイト">
<meta property="og:description" content="${esc(c.tagline)}">
<meta property="og:type" content="restaurant">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(c.fontHeading)}:wght@300;400;500;700&family=${encodeURIComponent(c.fontBody)}:wght@300;400;500&display=swap" rel="stylesheet">
<style>
:root{--primary:${c.colorPrimary};--accent:${c.colorAccent};--bg:${c.colorBg};--text:${c.colorText};--font-h:'${c.fontHeading}',serif;--font-b:'${c.fontBody}',sans-serif}
*,::before,::after{box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--font-b);background:var(--bg);color:var(--text)}

/* NAV */
#nav{transition:background .4s,backdrop-filter .4s,box-shadow .4s}
#nav.scrolled{background:rgba(255,255,255,.92);backdrop-filter:blur(12px);box-shadow:0 1px 24px rgba(0,0,0,.08)}
.nav-link{position:relative}
.nav-link::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:2px;background:var(--accent);transform:scaleX(0);transition:transform .3s}
.nav-link:hover::after{transform:scaleX(1)}

/* HERO */
#hero-bg{will-change:transform}
.hero-label{animation:fadeDown .8s ease .2s both}
.hero-title{animation:fadeDown .8s ease .4s both}
.hero-sub{animation:fadeDown .8s ease .6s both}
.hero-btns{animation:fadeDown .8s ease .8s both}
@keyframes fadeDown{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
.scroll-dot{animation:scrollBounce 2s ease infinite}
@keyframes scrollBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(8px)}}

/* GALLERY GRID */
.gallery-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:200px;gap:8px}
.gallery-item{overflow:hidden;border-radius:.75rem}
@media(max-width:640px){.gallery-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px}.gallery-item.col-span-2{grid-column:span 2}}

/* LIGHTBOX */
#lb{display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.92);place-items:center}
#lb.open{display:grid}
#lb img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:.5rem}

/* ANIMATIONS */
.reveal{opacity:0;transform:translateY(32px);transition:opacity .7s ease,transform .7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-left{opacity:0;transform:translateX(-32px);transition:opacity .7s ease,transform .7s ease}
.reveal-left.visible{opacity:1;transform:translateX(0)}
.reveal-right{opacity:0;transform:translateX(32px);transition:opacity .7s ease,transform .7s ease}
.reveal-right.visible{opacity:1;transform:translateX(0)}
.stagger-child:nth-child(1){transition-delay:.1s}
.stagger-child:nth-child(2){transition-delay:.2s}
.stagger-child:nth-child(3){transition-delay:.3s}
.stagger-child:nth-child(4){transition-delay:.4s}
.stagger-child:nth-child(5){transition-delay:.5s}
.stagger-child:nth-child(6){transition-delay:.6s}

/* SECTION DECO */
.section-tag{display:inline-block;font-size:.7rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--accent);margin-bottom:.75rem}
.section-rule{width:40px;height:3px;background:var(--accent);margin-top:1rem}
</style>
</head>
<body class="pb-20">

<!-- ========== NAV ========== -->
<nav id="nav" class="fixed top-0 left-0 right-0 z-50 px-[5%] h-[68px] flex items-center justify-between">
  <a href="#hero" class="nav-logo text-white text-xl font-bold tracking-wide transition-colors" style="font-family:var(--font-h)"
     id="nav-logo">${esc(meta.name)}</a>
  <ul class="hidden md:flex items-center gap-8 list-none">
    ${['about:コンセプト','menu:メニュー','gallery:ギャラリー','info:店舗情報','access:アクセス'].map(s => {
      const [id,label] = s.split(':')
      return `<li><a href="#${id}" class="nav-link text-sm font-medium text-white/90 hover:text-white transition-colors" id="navl-${id}">${label}</a></li>`
    }).join('')}
    ${phoneClean ? `<li><a href="tel:${phoneClean}" class="text-sm font-bold px-4 py-2 rounded-full text-white transition-all hover:opacity-80 hover:scale-105" style="background:var(--accent)">予約する</a></li>` : ''}
  </ul>
  <button id="hbg" class="md:hidden flex flex-col gap-1.5 p-2" aria-label="メニュー">
    <span class="block w-6 h-0.5 bg-white transition-all" id="hbg1"></span>
    <span class="block w-6 h-0.5 bg-white transition-all" id="hbg2"></span>
    <span class="block w-6 h-0.5 bg-white transition-all" id="hbg3"></span>
  </button>
</nav>

<!-- MOBILE MENU -->
<div id="mob" class="hidden fixed top-[68px] left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-xl border-t border-gray-100 py-6 px-[5%]">
  <ul class="flex flex-col gap-1 list-none">
    ${['about:コンセプト','menu:メニュー','gallery:ギャラリー','info:店舗情報','access:アクセス'].map(s => {
      const [id,label] = s.split(':')
      return `<li><a href="#${id}" onclick="closeMob()" class="block py-3 text-base font-medium border-b border-gray-100 transition-colors hover:text-[var(--accent)]" style="color:var(--text)">${label}</a></li>`
    }).join('')}
    ${phoneClean ? `<li class="mt-3"><a href="tel:${phoneClean}" class="block text-center py-3 rounded-xl text-white font-bold text-base" style="background:var(--accent)">📞 予約する</a></li>` : ''}
  </ul>
</div>

<!-- ========== HERO ========== -->
<section id="hero" class="relative h-screen min-h-[600px] flex items-center justify-center text-center overflow-hidden">
  <img id="hero-bg" src="${esc(meta.heroImgSrc)}" alt="${esc(meta.name)}"
       class="absolute inset-0 w-full h-[120%] -top-[10%] object-cover"
       onerror="this.style.display='none';document.getElementById('hero').style.background='linear-gradient(135deg,${c.colorPrimary},${c.colorAccent})'">
  <!-- グラデーションオーバーレイ -->
  <div class="absolute inset-0" style="background:linear-gradient(to bottom,rgba(0,0,0,.35) 0%,rgba(0,0,0,.2) 40%,rgba(0,0,0,.65) 100%)"></div>

  <div class="relative z-10 text-white px-6 max-w-4xl mx-auto">
    <span class="hero-label inline-block border border-white/50 text-white/90 text-xs tracking-[.25em] px-4 py-1.5 rounded-full mb-6 uppercase">${esc(meta.cuisine)}</span>
    <h1 class="hero-title text-5xl sm:text-7xl font-bold leading-none mb-4 tracking-tight" style="font-family:var(--font-h)">${esc(meta.name)}</h1>
    <p class="hero-sub text-lg sm:text-xl font-light opacity-90 mb-8 tracking-wide">${esc(c.tagline)}</p>
    <div class="hero-btns flex flex-wrap gap-3 justify-center">
      ${phoneClean ? `<a href="tel:${phoneClean}" class="inline-flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-full text-base transition-all hover:scale-105 hover:brightness-110 shadow-lg" style="background:var(--accent)">📞 お電話でご予約</a>` : ''}
      <a href="#about" class="inline-flex items-center gap-2 border-2 border-white/70 text-white font-semibold px-7 py-3.5 rounded-full text-base hover:bg-white/10 transition-all">詳しく見る ↓</a>
    </div>
  </div>

  <!-- スクロール -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/70">
    <span class="text-[10px] tracking-[.3em] uppercase">Scroll</span>
    <div class="scroll-dot w-5 h-5 border-r-2 border-b-2 border-white/70 rotate-45"></div>
  </div>
</section>

<!-- ========== CONCEPT ========== -->
<section id="about" class="py-24 px-[5%]" style="background:var(--bg)">
  <div class="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
    <div class="reveal-left">
      <span class="section-tag">Our Story</span>
      <h2 class="text-4xl sm:text-5xl font-bold leading-tight mb-2" style="color:var(--primary);font-family:var(--font-h)">${esc(c.conceptTitle)}</h2>
      <div class="section-rule mb-6"></div>
      <p class="text-gray-600 leading-relaxed text-base mb-10">${esc(c.conceptText)}</p>
      <div class="flex flex-col gap-5">
        ${c.pillars.map(p => `
        <div class="flex gap-4 items-start group">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform group-hover:scale-110" style="background:var(--accent)20">${p.icon}</div>
          <div>
            <div class="font-bold text-base mb-1" style="color:var(--primary);font-family:var(--font-h)">${esc(p.title)}</div>
            <div class="text-sm text-gray-500 leading-relaxed">${esc(p.text)}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div class="reveal-right">
      <div class="relative">
        <img src="${esc(meta.galleryImgSrcs[0] || meta.heroImgSrc)}" alt="${esc(meta.name)}"
             class="w-full h-[480px] object-cover rounded-2xl shadow-2xl"
             onerror="this.src='${esc(meta.heroImgSrc)}'">
        ${rating > 0 ? `
        <div class="absolute -bottom-5 -right-5 w-28 h-28 rounded-full flex flex-col items-center justify-center text-white shadow-xl" style="background:var(--accent)">
          <span class="text-3xl font-bold leading-none" style="font-family:var(--font-h)">${esc(meta.rating)}</span>
          <span class="text-[9px] tracking-wider mt-1 opacity-80">食べログ評価</span>
        </div>` : ''}
      </div>
    </div>
  </div>
</section>

<!-- ========== MENU ========== -->
<section id="menu" class="py-24 px-[5%]" style="background:color-mix(in srgb,var(--bg) 50%,#f5f0e8 50%)">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-14 reveal">
      <span class="section-tag">Our Menu</span>
      <h2 class="text-4xl sm:text-5xl font-bold" style="color:var(--primary);font-family:var(--font-h)">おすすめメニュー</h2>
      <div class="section-rule mx-auto mt-4"></div>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${c.menu.map((item, i) => `<div class="reveal stagger-child">${menuCard(item, i, meta.menuImgSrcs[i])}</div>`).join('\n')}
    </div>
  </div>
</section>

<!-- ========== GALLERY ========== -->
<section id="gallery" class="py-24 px-[5%]" style="background:var(--primary)">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-12 reveal">
      <span class="section-tag" style="color:var(--accent)">Photo Gallery</span>
      <h2 class="text-4xl sm:text-5xl font-bold text-white" style="font-family:var(--font-h)">フォトギャラリー</h2>
      <div class="section-rule mx-auto mt-4"></div>
    </div>
    <div class="gallery-grid reveal">
      ${galleryHtml}
    </div>
  </div>
</section>

<!-- ========== INFO ========== -->
<section id="info" class="py-24 px-[5%]" style="background:var(--bg)">
  <div class="max-w-6xl mx-auto grid md:grid-cols-5 gap-12 items-start">
    <div class="md:col-span-3 reveal-left">
      <span class="section-tag">Shop Info</span>
      <h2 class="text-4xl font-bold mb-2" style="color:var(--primary);font-family:var(--font-h)">店舗情報</h2>
      <div class="section-rule mb-8"></div>
      <dl class="divide-y divide-gray-100">
        ${[
          ['住所', meta.address],
          ['電話番号', meta.phone ? `<a href="tel:${phoneClean}" style="color:var(--accent)" class="font-semibold hover:underline">${esc(meta.phone)}</a>` : ''],
          ['営業時間', meta.hours ? `<span class="whitespace-pre-line">${esc(meta.hours)}</span>` : ''],
          ['価格帯', meta.priceRange],
          ['席数', meta.seats],
          ['アクセス', meta.access],
        ].filter(([,v]) => v).map(([k,v]) => `
        <div class="flex gap-4 py-4">
          <dt class="w-28 flex-shrink-0 text-sm font-semibold text-gray-400 pt-0.5">${esc(k as string)}</dt>
          <dd class="text-sm leading-relaxed text-gray-700 flex-1">${v}</dd>
        </div>`).join('')}
      </dl>
    </div>
    <div class="md:col-span-2 reveal-right flex flex-col gap-4">
      ${rating > 0 ? `
      <div class="rounded-2xl p-6 border" style="border-color:var(--accent)30;background:var(--accent)08">
        <div class="text-amber-500 text-2xl tracking-widest mb-2">${stars}</div>
        <div class="text-4xl font-bold mb-1" style="color:var(--primary);font-family:var(--font-h)">${esc(meta.rating)} <span class="text-lg font-normal text-gray-400">/ 5.0</span></div>
        <div class="text-xs text-gray-400">食べログ評価</div>
      </div>` : ''}
      <div class="flex flex-col gap-3">
        ${phoneClean ? `<a href="tel:${phoneClean}" class="flex items-center justify-center gap-2 text-white font-bold py-3.5 rounded-xl text-base transition-all hover:brightness-110 hover:scale-[1.02] shadow" style="background:var(--accent)">📞 ${esc(meta.phone || 'お電話でご予約')}</a>` : ''}
        ${meta.tabelogUrl ? `<a href="${esc(meta.tabelogUrl)}" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl text-base transition-all hover:scale-[1.02]">🍽 食べログで見る</a>` : ''}
        ${meta.googleMapsUrl ? `<a href="${esc(meta.googleMapsUrl)}" target="_blank" rel="noopener" class="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl text-base transition-all hover:scale-[1.02]">📍 Google マップ</a>` : ''}
      </div>
    </div>
  </div>
</section>

<!-- ========== MAP ========== -->
${mapHtml ? `
<section id="access" class="py-24 px-[5%]" style="background:#f0ece6">
  <div class="max-w-6xl mx-auto">
    <div class="mb-10 reveal">
      <span class="section-tag">Access</span>
      <h2 class="text-4xl font-bold mb-2" style="color:var(--primary);font-family:var(--font-h)">アクセス</h2>
      <div class="section-rule mb-4"></div>
      ${meta.address ? `<p class="text-gray-600 text-sm">📍 ${esc(meta.address)}</p>` : ''}
    </div>
    <div class="grid md:grid-cols-2 gap-8 items-center">
      <div class="reveal-left h-80 rounded-2xl overflow-hidden shadow-xl">${mapHtml}</div>
      <div class="reveal-right space-y-4">
        ${meta.access ? `<div class="bg-white rounded-xl p-5 shadow-sm"><p class="text-sm font-semibold text-gray-400 mb-1">🚃 アクセス</p><p class="text-gray-700 text-sm">${esc(meta.access)}</p></div>` : ''}
        ${meta.hours ? `<div class="bg-white rounded-xl p-5 shadow-sm"><p class="text-sm font-semibold text-gray-400 mb-1">🕐 営業時間</p><p class="text-gray-700 text-sm whitespace-pre-line">${esc(meta.hours)}</p></div>` : ''}
        ${meta.googleMapsUrl ? `<a href="${esc(meta.googleMapsUrl)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 font-bold py-3 px-6 rounded-xl text-white text-sm transition-all hover:scale-105" style="background:var(--accent)">Google マップで開く →</a>` : ''}
      </div>
    </div>
  </div>
</section>` : ''}

<!-- ========== CTA ========== -->
<section id="cta" class="py-28 px-[5%] text-center text-white relative overflow-hidden" style="background:var(--primary)">
  <div class="absolute inset-0 opacity-5" style="background-image:repeating-linear-gradient(45deg,var(--accent) 0,var(--accent) 1px,transparent 0,transparent 50%);background-size:20px 20px"></div>
  <div class="relative z-10 reveal">
    <span class="section-tag">Reservation</span>
    <h2 class="text-3xl sm:text-5xl font-bold mb-4" style="font-family:var(--font-h)">ご予約・お問い合わせ</h2>
    <p class="text-white/60 mb-10 text-lg">皆様のご来店を心よりお待ちしております</p>
    ${phoneClean ? `
    <div class="text-4xl sm:text-6xl font-bold mb-2 tracking-tight" style="color:var(--accent);font-family:var(--font-h)">${esc(meta.phone)}</div>
    <p class="text-white/50 text-sm mb-10">${meta.hours ? esc(meta.hours.split('\n')[0]) : '営業時間内にお電話ください'}</p>
    <div class="flex flex-wrap gap-4 justify-center">
      <a href="tel:${phoneClean}" class="inline-flex items-center gap-2 font-bold py-4 px-8 rounded-full text-lg text-white transition-all hover:scale-105 hover:brightness-110 shadow-2xl" style="background:var(--accent)">📞 今すぐ電話する</a>
      ${meta.tabelogUrl ? `<a href="${esc(meta.tabelogUrl)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 border-2 border-white/30 font-semibold py-4 px-8 rounded-full text-lg hover:bg-white/10 transition-all">食べログで予約</a>` : ''}
    </div>` : `
    <div class="flex flex-wrap gap-4 justify-center">
      ${meta.tabelogUrl ? `<a href="${esc(meta.tabelogUrl)}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 font-bold py-4 px-8 rounded-full text-lg text-white transition-all hover:scale-105" style="background:var(--accent)">食べログで予約する</a>` : ''}
    </div>`}
  </div>
</section>

<!-- ========== FOOTER ========== -->
<footer class="bg-black text-white/50 py-12 px-[5%]">
  <div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 pb-8 border-b border-white/10">
    <div>
      <div class="text-white text-xl font-bold mb-2" style="font-family:var(--font-h)">${esc(meta.name)}</div>
      <p class="text-sm leading-relaxed">${esc(c.tagline)}</p>
      ${meta.address ? `<p class="text-xs mt-2">${esc(meta.address)}</p>` : ''}
    </div>
    <div>
      <div class="text-white text-sm font-semibold mb-3">メニュー</div>
      <ul class="space-y-2 text-sm">
        ${['about:コンセプト','menu:メニュー','gallery:ギャラリー','info:店舗情報','access:アクセス'].map(s => {
          const [id,label] = s.split(':')
          return `<li><a href="#${id}" class="hover:text-white transition-colors">${label}</a></li>`
        }).join('')}
      </ul>
    </div>
    <div>
      <div class="text-white text-sm font-semibold mb-3">お問い合わせ</div>
      <div class="space-y-2 text-sm">
        ${phoneClean ? `<div><a href="tel:${phoneClean}" class="hover:text-white transition-colors">${esc(meta.phone)}</a></div>` : ''}
        ${meta.tabelogUrl ? `<div><a href="${esc(meta.tabelogUrl)}" target="_blank" rel="noopener" class="hover:text-white transition-colors">食べログ</a></div>` : ''}
        ${meta.googleMapsUrl ? `<div><a href="${esc(meta.googleMapsUrl)}" target="_blank" rel="noopener" class="hover:text-white transition-colors">Google マップ</a></div>` : ''}
      </div>
    </div>
  </div>
  <div class="max-w-6xl mx-auto pt-6 text-center text-xs">© 2025 ${esc(meta.name)}. All rights reserved.</div>
</footer>

<!-- LIGHTBOX -->
<div id="lb" onclick="closeLb()">
  <button onclick="closeLb()" class="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none bg-white/10 w-10 h-10 rounded-full">✕</button>
  <img id="lb-img" src="" alt="" class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg">
</div>

<script>
// NAV スクロール
const nav=document.getElementById('nav')
const navLogo=document.getElementById('nav-logo')
const navLinks=document.querySelectorAll('[id^="navl-"]')
window.addEventListener('scroll',()=>{
  const s=window.scrollY>80
  nav.classList.toggle('scrolled',s)
  navLogo.style.color=s?'var(--primary)':'white'
  navLinks.forEach(l=>l.style.color=s?'var(--text)':'rgba(255,255,255,.9)')
  // パララックス
  document.getElementById('hero-bg').style.transform='translateY('+window.scrollY*.35+'px)'
})

// ハンバーガー
const hbg=document.getElementById('hbg')
const mob=document.getElementById('mob')
let open=false
hbg.onclick=()=>{
  open=!open
  mob.classList.toggle('hidden',!open)
  document.getElementById('hbg1').style.transform=open?'translateY(7px) rotate(45deg)':''
  document.getElementById('hbg2').style.opacity=open?'0':'1'
  document.getElementById('hbg3').style.transform=open?'translateY(-7px) rotate(-45deg)':''
}
function closeMob(){open=false;mob.classList.add('hidden');['hbg1','hbg2','hbg3'].forEach((id,i)=>{document.getElementById(id).style.transform='';if(i===1)document.getElementById(id).style.opacity='1'})}

// スムーススクロール
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();const t=document.querySelector(a.getAttribute('href'));if(t){closeMob();t.scrollIntoView({behavior:'smooth',block:'start'})}
}))

// スクロールアニメーション
const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}})},{threshold:.12})
document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach(el=>io.observe(el))

// ライトボックス
function openLb(src){document.getElementById('lb-img').src=src;document.getElementById('lb').classList.add('open');document.body.style.overflow='hidden'}
function closeLb(){document.getElementById('lb').classList.remove('open');document.body.style.overflow=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLb()})
</script>
</body>
</html>`
}
