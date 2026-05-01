export interface MenuItemContent {
  name: string
  desc: string
  price: string
  badge: string
  imgKeyword: string
}

export interface ConceptPillar {
  icon: string
  title: string
  text: string
}

export interface RestaurantContent {
  tagline: string
  conceptTitle: string
  conceptText: string
  pillars: ConceptPillar[]
  menu: MenuItemContent[]
  colorPrimary: string
  colorAccent: string
  colorBg: string
  colorText: string
  fontHeading: string
  fontBody: string
}

export interface RestaurantMeta {
  name: string
  cuisine: string
  address: string
  phone: string
  hours: string
  priceRange: string
  seats: string
  access: string
  rating: string
  tabelogUrl: string
  googleMapsUrl: string
  heroImgSrc: string
  galleryImgSrcs: string[]
  menuImgSrcs: string[]   // 食べログから取得した写真（メニュー用）
  mapsEmbedSrc: string
}

function menuCard(item: MenuItemContent, idx: number, menuImgSrc?: string): string {
  // 食べログ写真があればそれを使い、なければUnsplashにフォールバック
  const unsplashSrc = `https://source.unsplash.com/600x400/?${encodeURIComponent(item.imgKeyword)}`
  const imgSrc = menuImgSrc || unsplashSrc
  const fallbackSrc = menuImgSrc ? unsplashSrc : `https://source.unsplash.com/600x400/?food,restaurant,japanese`
  return `
    <div class="menu-card" style="animation-delay:${idx * 0.1}s">
      <div class="menu-card-img-wrap">
        <img src="${imgSrc}" alt="${item.name}" class="menu-card-img"
             onerror="this.onerror=null;this.src='${fallbackSrc}'">
        <span class="menu-badge">${item.badge}</span>
      </div>
      <div class="menu-card-body">
        <h3 class="menu-name">${item.name}</h3>
        <p class="menu-desc">${item.desc}</p>
        <div class="menu-price-row">
          <span class="menu-price">¥${item.price}</span>
          <span class="menu-tax">（税込）</span>
        </div>
      </div>
    </div>`
}

function galleryGrid(srcs: string[], name: string): string {
  if (!srcs.length) {
    return `<p style="text-align:center;color:#999">画像を読み込み中...</p>`
  }
  return srcs.map((src, i) => `
    <div class="gallery-item ${i === 0 ? 'gallery-item-wide' : ''}">
      <img src="${src}" alt="${name} フォト${i + 1}" class="gallery-img"
           onclick="openLightbox('${src}')"
           onerror="this.parentElement.style.display='none'">
      <div class="gallery-overlay"><span>拡大</span></div>
    </div>`).join('')
}

export function buildHtml(meta: RestaurantMeta, content: RestaurantContent): string {
  const phoneClean = meta.phone.replace(/[-\s()]/g, '')
  const ratingNum = parseFloat(meta.rating) || 0
  const stars = '★'.repeat(Math.round(ratingNum)) + '☆'.repeat(5 - Math.round(ratingNum))

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.name} | 公式サイト</title>
<meta name="description" content="${meta.name}の公式サイト。${meta.cuisine}の専門店。${meta.address}">
<meta property="og:title" content="${meta.name} | 公式サイト">
<meta property="og:description" content="${content.tagline}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(content.fontHeading)}:wght@300;400;500;700&family=${encodeURIComponent(content.fontBody)}:wght@300;400;500&display=swap" rel="stylesheet">
<style>
:root {
  --primary: ${content.colorPrimary};
  --accent: ${content.colorAccent};
  --bg: ${content.colorBg};
  --text: ${content.colorText};
  --font-h: '${content.fontHeading}', serif;
  --font-b: '${content.fontBody}', sans-serif;
}
*,*::before,*::after { box-sizing:border-box; margin:0; padding:0 }
html { scroll-behavior: smooth }
body { background:var(--bg); color:var(--text); font-family:var(--font-b); line-height:1.7 }

/* ── NAV ── */
#nav {
  position:fixed; top:0; left:0; right:0; z-index:100;
  display:flex; align-items:center; justify-content:space-between;
  padding:0 5%; height:72px;
  transition: background 0.4s, box-shadow 0.4s;
}
#nav.scrolled { background:rgba(255,255,255,0.97); box-shadow:0 2px 20px rgba(0,0,0,0.08) }
.nav-logo { font-family:var(--font-h); font-size:1.3rem; font-weight:700; color:#fff; text-decoration:none; letter-spacing:.05em }
#nav.scrolled .nav-logo { color:var(--primary) }
.nav-links { display:flex; gap:2rem; list-style:none }
.nav-links a { text-decoration:none; color:rgba(255,255,255,0.9); font-size:.9rem; font-weight:500; transition:color .2s }
#nav.scrolled .nav-links a { color:var(--text) }
.nav-links a:hover { color:var(--accent) }
.nav-cta {
  background:var(--accent); color:#fff !important; padding:.5rem 1.2rem;
  border-radius:2rem; font-weight:700 !important; transition:transform .2s, box-shadow .2s !important;
}
.nav-cta:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(0,0,0,0.2) }
.hamburger { display:none; flex-direction:column; gap:5px; cursor:pointer; padding:4px }
.hamburger span { display:block; width:24px; height:2px; background:#fff; transition:all .3s }
#nav.scrolled .hamburger span { background:var(--primary) }
#mobile-menu {
  display:none; position:fixed; top:72px; left:0; right:0; z-index:99;
  background:rgba(255,255,255,0.98); backdrop-filter:blur(10px);
  padding:1.5rem 5% 2rem; box-shadow:0 8px 24px rgba(0,0,0,0.12);
}
#mobile-menu.open { display:block }
#mobile-menu ul { list-style:none; display:flex; flex-direction:column; gap:1rem }
#mobile-menu a { text-decoration:none; color:var(--text); font-size:1.1rem; font-weight:500; padding:.5rem 0; border-bottom:1px solid #eee; display:block }

/* ── HERO ── */
#hero {
  position:relative; height:100vh; min-height:600px;
  display:flex; align-items:center; justify-content:center; text-align:center; overflow:hidden;
}
.hero-bg {
  position:absolute; inset:0; width:100%; height:120%;
  object-fit:cover; will-change:transform;
}
.hero-overlay {
  position:absolute; inset:0;
  background:linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.65) 100%);
}
.hero-content { position:relative; z-index:2; color:#fff; padding:0 1.5rem; max-width:800px }
.hero-label {
  display:inline-block; border:1px solid rgba(255,255,255,0.6);
  padding:.3rem 1.2rem; border-radius:2rem; font-size:.85rem; letter-spacing:.15em; margin-bottom:1.5rem;
}
.hero-title { font-family:var(--font-h); font-size:clamp(2.5rem,8vw,5.5rem); font-weight:700; line-height:1.15; margin-bottom:1rem; letter-spacing:.05em }
.hero-tagline { font-size:clamp(1rem,2.5vw,1.3rem); font-weight:300; opacity:.9; margin-bottom:2.5rem; letter-spacing:.05em }
.hero-btns { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap }
.btn-primary {
  display:inline-flex; align-items:center; gap:.5rem;
  background:var(--accent); color:#fff; padding:.9rem 2rem;
  border-radius:3rem; font-weight:700; font-size:1rem; text-decoration:none;
  transition:transform .2s, box-shadow .2s; border:none; cursor:pointer;
}
.btn-primary:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(0,0,0,0.25) }
.btn-outline {
  display:inline-flex; align-items:center; gap:.5rem;
  border:2px solid rgba(255,255,255,0.8); color:#fff; padding:.9rem 2rem;
  border-radius:3rem; font-weight:600; font-size:1rem; text-decoration:none;
  transition:all .2s;
}
.btn-outline:hover { background:rgba(255,255,255,0.15) }
.hero-scroll {
  position:absolute; bottom:2rem; left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; gap:.5rem; color:rgba(255,255,255,0.8);
  font-size:.75rem; letter-spacing:.15em; z-index:2;
}
.scroll-arrow { width:24px; height:24px; border-right:2px solid rgba(255,255,255,0.8); border-bottom:2px solid rgba(255,255,255,0.8); transform:rotate(45deg); animation:arrowBounce 1.5s infinite }
@keyframes arrowBounce { 0%,100%{transform:rotate(45deg) translateY(0)} 50%{transform:rotate(45deg) translateY(6px)} }

/* ── SECTION BASE ── */
section { padding:6rem 5% }
.section-label { font-size:.8rem; letter-spacing:.2em; color:var(--accent); font-weight:600; text-transform:uppercase; margin-bottom:.75rem }
.section-title { font-family:var(--font-h); font-size:clamp(1.8rem,4vw,3rem); font-weight:700; color:var(--primary); line-height:1.2; margin-bottom:1rem }
.section-divider { width:48px; height:3px; background:var(--accent); margin:1.5rem 0 }
.section-sub { color:#666; font-size:1rem; line-height:1.8; max-width:600px }

/* ── CONCEPT ── */
#about { background:var(--bg) }
.about-grid { display:grid; grid-template-columns:1fr 1fr; gap:5rem; align-items:center; max-width:1100px; margin:0 auto }
.about-img-wrap { position:relative }
.about-img { width:100%; height:480px; object-fit:cover; border-radius:1.5rem; box-shadow:0 24px 64px rgba(0,0,0,0.15) }
.about-img-badge {
  position:absolute; bottom:-1.5rem; right:-1.5rem;
  background:var(--accent); color:#fff; border-radius:50%;
  width:110px; height:110px; display:flex; flex-direction:column; align-items:center; justify-content:center;
  font-family:var(--font-h); box-shadow:0 8px 24px rgba(0,0,0,0.2);
}
.about-img-badge .badge-num { font-size:2rem; font-weight:700; line-height:1 }
.about-img-badge .badge-txt { font-size:.65rem; letter-spacing:.08em }
.pillars { display:flex; flex-direction:column; gap:1.5rem; margin-top:2.5rem }
.pillar { display:flex; gap:1.2rem; align-items:flex-start }
.pillar-icon { font-size:2rem; flex-shrink:0; width:48px; height:48px; background:var(--accent); border-radius:.75rem; display:grid; place-items:center }
.pillar-title { font-family:var(--font-h); font-size:1.1rem; font-weight:700; color:var(--primary); margin-bottom:.3rem }
.pillar-text { font-size:.9rem; color:#666; line-height:1.7 }

/* ── MENU ── */
#menu { background:#f7f3ee }
#menu .inner { max-width:1200px; margin:0 auto }
#menu .section-header { text-align:center; margin-bottom:3.5rem }
#menu .section-divider { margin:1.5rem auto }
.menu-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2rem }
.menu-card {
  background:#fff; border-radius:1.25rem; overflow:hidden;
  box-shadow:0 4px 20px rgba(0,0,0,0.07); transition:transform .3s, box-shadow .3s;
}
.menu-card:hover { transform:translateY(-8px); box-shadow:0 16px 48px rgba(0,0,0,0.15) }
.menu-card-img-wrap { position:relative; height:220px; overflow:hidden }
.menu-card-img { width:100%; height:100%; object-fit:cover; transition:transform .5s }
.menu-card:hover .menu-card-img { transform:scale(1.08) }
.menu-badge {
  position:absolute; top:.75rem; left:.75rem;
  background:var(--accent); color:#fff; padding:.25rem .75rem; border-radius:2rem; font-size:.75rem; font-weight:700;
}
.menu-card-body { padding:1.25rem 1.5rem 1.5rem }
.menu-name { font-family:var(--font-h); font-size:1.15rem; font-weight:700; color:var(--primary); margin-bottom:.5rem }
.menu-desc { font-size:.85rem; color:#777; line-height:1.7; margin-bottom:1rem; min-height:3.5rem }
.menu-price-row { display:flex; align-items:baseline; gap:.4rem }
.menu-price { font-size:1.6rem; font-weight:700; color:var(--accent); font-family:var(--font-h) }
.menu-tax { font-size:.75rem; color:#aaa }

/* ── GALLERY ── */
#gallery { background:var(--primary) }
#gallery .section-label, #gallery .section-title { color:#fff }
#gallery .section-divider { background:var(--accent) }
.gallery-grid {
  display:grid;
  grid-template-columns:repeat(3,1fr);
  grid-auto-rows:220px;
  gap:12px; max-width:1100px; margin:2.5rem auto 0;
}
.gallery-item { position:relative; overflow:hidden; border-radius:10px; cursor:pointer }
.gallery-item-wide { grid-column:span 2 }
.gallery-img { width:100%; height:100%; object-fit:cover; transition:transform .5s }
.gallery-item:hover .gallery-img { transform:scale(1.06) }
.gallery-overlay {
  position:absolute; inset:0; background:rgba(0,0,0,0); display:grid; place-items:center;
  transition:background .3s; color:#fff; font-size:.85rem; letter-spacing:.1em; opacity:0;
}
.gallery-item:hover .gallery-overlay { background:rgba(0,0,0,0.35); opacity:1 }

/* ── INFO ── */
#info { background:var(--bg) }
.info-grid { display:grid; grid-template-columns:3fr 2fr; gap:4rem; max-width:1100px; margin:0 auto; align-items:start }
.info-table { width:100%; border-collapse:collapse }
.info-table tr { border-bottom:1px solid #e8e0d5 }
.info-table tr:first-child { border-top:1px solid #e8e0d5 }
.info-table th { width:130px; padding:1rem 0; font-size:.85rem; font-weight:600; color:#888; text-align:left; vertical-align:top }
.info-table td { padding:1rem 0; font-size:.95rem; color:var(--text); line-height:1.7 }
.info-links { display:flex; flex-direction:column; gap:1rem }
.info-link-btn {
  display:flex; align-items:center; gap:.75rem; padding:1rem 1.5rem;
  border-radius:.75rem; text-decoration:none; font-weight:600; font-size:.95rem; transition:transform .2s, box-shadow .2s;
}
.info-link-btn:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.12) }
.btn-tel { background:var(--accent); color:#fff }
.btn-tabelog { background:#e8341c; color:#fff }
.btn-gmap { background:#4285f4; color:#fff }
.rating-wrap { margin-top:2rem; padding:1.5rem; background:#f7f3ee; border-radius:1rem }
.rating-stars { color:#F5A623; font-size:1.3rem; letter-spacing:.1em }
.rating-score { font-size:2rem; font-weight:700; font-family:var(--font-h); color:var(--primary) }

/* ── MAP ── */
#access { background:#f0ece6; padding:6rem 5% }
#access .inner { max-width:1100px; margin:0 auto }
.access-grid { display:grid; grid-template-columns:1fr 1fr; gap:4rem; align-items:center; margin-top:3rem }
.access-address { font-size:1.1rem; line-height:2; color:var(--text) }
.access-detail { font-size:.9rem; color:#888; margin-top:.5rem }
.access-map { border-radius:1rem; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.12) }
.access-map iframe { display:block }

/* ── CTA ── */
#cta { background:var(--primary); text-align:center; padding:7rem 5% }
.cta-title { font-family:var(--font-h); font-size:clamp(1.5rem,4vw,2.8rem); color:#fff; margin-bottom:1rem }
.cta-sub { color:rgba(255,255,255,0.7); margin-bottom:2.5rem; font-size:1rem }
.cta-phone { font-family:var(--font-h); font-size:clamp(2rem,5vw,3.5rem); color:var(--accent); font-weight:700; margin-bottom:.5rem }
.cta-hours { color:rgba(255,255,255,0.6); font-size:.85rem; margin-bottom:2.5rem }
.cta-btns { display:flex; gap:1rem; justify-content:center; flex-wrap:wrap }

/* ── FOOTER ── */
footer { background:#0d0d0d; color:rgba(255,255,255,0.7); padding:4rem 5% 2rem }
.footer-grid { display:grid; grid-template-columns:2fr 1fr 1fr; gap:3rem; max-width:1100px; margin:0 auto; padding-bottom:3rem; border-bottom:1px solid rgba(255,255,255,0.1) }
.footer-brand { font-family:var(--font-h); font-size:1.4rem; font-weight:700; color:#fff; margin-bottom:1rem }
.footer-tagline { font-size:.85rem; line-height:1.8 }
.footer-nav-title { font-weight:600; color:#fff; margin-bottom:1rem; font-size:.9rem }
.footer-nav ul { list-style:none; display:flex; flex-direction:column; gap:.5rem }
.footer-nav a { color:rgba(255,255,255,0.6); text-decoration:none; font-size:.85rem; transition:color .2s }
.footer-nav a:hover { color:var(--accent) }
.footer-bottom { max-width:1100px; margin:.5rem auto 0; text-align:center; font-size:.75rem; padding-top:1.5rem }

/* ── ANIMATIONS ── */
.fade-up { opacity:0; transform:translateY(40px); transition:opacity .7s ease, transform .7s ease }
.fade-up.visible { opacity:1; transform:translateY(0) }
.fade-left { opacity:0; transform:translateX(-40px); transition:opacity .7s ease, transform .7s ease }
.fade-left.visible { opacity:1; transform:translateX(0) }
.fade-right { opacity:0; transform:translateX(40px); transition:opacity .7s ease, transform .7s ease }
.fade-right.visible { opacity:1; transform:translateX(0) }

/* ── LIGHTBOX ── */
#lightbox {
  display:none; position:fixed; inset:0; z-index:999;
  background:rgba(0,0,0,0.92); place-items:center;
}
#lightbox.open { display:grid }
#lightbox img { max-width:90vw; max-height:90vh; object-fit:contain; border-radius:.5rem }
#lightbox-close {
  position:absolute; top:1.5rem; right:1.5rem;
  background:rgba(255,255,255,0.2); border:none; color:#fff;
  width:44px; height:44px; border-radius:50%; font-size:1.3rem; cursor:pointer;
  display:grid; place-items:center; transition:background .2s;
}
#lightbox-close:hover { background:rgba(255,255,255,0.35) }

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .about-grid, .info-grid, .access-grid, .footer-grid { grid-template-columns:1fr }
  .about-img-badge { right:.5rem; bottom:.5rem }
  .menu-grid { grid-template-columns:repeat(2,1fr) }
  .gallery-grid { grid-template-columns:repeat(2,1fr) }
  .gallery-item-wide { grid-column:span 2 }
}
@media(max-width:640px){
  .nav-links { display:none }
  .hamburger { display:flex }
  .menu-grid { grid-template-columns:1fr }
  .gallery-grid { grid-template-columns:1fr; grid-auto-rows:200px }
  .gallery-item-wide { grid-column:span 1 }
  section { padding:4rem 5% }
}
</style>
</head>
<body>

<!-- NAV -->
<nav id="nav">
  <a href="#hero" class="nav-logo">${meta.name}</a>
  <ul class="nav-links">
    <li><a href="#about">コンセプト</a></li>
    <li><a href="#menu">メニュー</a></li>
    <li><a href="#gallery">ギャラリー</a></li>
    <li><a href="#info">店舗情報</a></li>
    <li><a href="#access">アクセス</a></li>
    ${phoneClean ? `<li><a href="tel:${phoneClean}" class="nav-cta">📞 予約する</a></li>` : `<li><a href="#cta" class="nav-cta">予約する</a></li>`}
  </ul>
  <div class="hamburger" id="hamburger">
    <span></span><span></span><span></span>
  </div>
</nav>

<!-- MOBILE MENU -->
<div id="mobile-menu">
  <ul>
    <li><a href="#about" onclick="closeMobile()">コンセプト</a></li>
    <li><a href="#menu" onclick="closeMobile()">メニュー</a></li>
    <li><a href="#gallery" onclick="closeMobile()">ギャラリー</a></li>
    <li><a href="#info" onclick="closeMobile()">店舗情報</a></li>
    <li><a href="#access" onclick="closeMobile()">アクセス</a></li>
    ${phoneClean ? `<li><a href="tel:${phoneClean}" onclick="closeMobile()">📞 お電話でご予約</a></li>` : ''}
  </ul>
</div>

<!-- HERO -->
<section id="hero">
  <img src="${meta.heroImgSrc}" alt="${meta.name}" class="hero-bg" id="hero-bg"
       onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,${content.colorPrimary},${content.colorAccent})'">
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <span class="hero-label">${meta.cuisine}</span>
    <h1 class="hero-title">${meta.name}</h1>
    <p class="hero-tagline">${content.tagline}</p>
    <div class="hero-btns">
      ${phoneClean ? `<a href="tel:${phoneClean}" class="btn-primary">📞 お電話でご予約</a>` : `<a href="#cta" class="btn-primary">ご予約・お問い合わせ</a>`}
      <a href="#about" class="btn-outline">詳しく見る ↓</a>
    </div>
  </div>
  <div class="hero-scroll"><span>SCROLL</span><div class="scroll-arrow"></div></div>
</section>

<!-- CONCEPT -->
<section id="about">
  <div class="about-grid">
    <div class="fade-left">
      <p class="section-label">Our Story</p>
      <h2 class="section-title">${content.conceptTitle}</h2>
      <div class="section-divider"></div>
      <p class="section-sub">${content.conceptText}</p>
      <div class="pillars">
        ${content.pillars.map(p => `
        <div class="pillar">
          <div class="pillar-icon">${p.icon}</div>
          <div>
            <div class="pillar-title">${p.title}</div>
            <div class="pillar-text">${p.text}</div>
          </div>
        </div>`).join('')}
      </div>
    </div>
    <div class="fade-right">
      <div class="about-img-wrap">
        <img src="${meta.galleryImgSrcs[0] || meta.heroImgSrc}" alt="${meta.name} のこだわり" class="about-img"
             onerror="this.src='${meta.heroImgSrc}'">
        ${meta.rating ? `<div class="about-img-badge"><span class="badge-num">${meta.rating}</span><span class="badge-txt">食べログ評価</span></div>` : ''}
      </div>
    </div>
  </div>
</section>

<!-- MENU -->
<section id="menu">
  <div class="inner">
    <div class="section-header fade-up">
      <p class="section-label">Our Menu</p>
      <h2 class="section-title">おすすめメニュー</h2>
      <div class="section-divider"></div>
      <p style="color:#888;font-size:.95rem">素材にこだわった自慢の一品をご紹介します</p>
    </div>
    <div class="menu-grid">
      ${content.menu.map((item, i) => menuCard(item, i, meta.menuImgSrcs[i])).join('')}
    </div>
  </div>
</section>

<!-- GALLERY -->
<section id="gallery">
  <div class="fade-up">
    <p class="section-label" style="text-align:center">Photo Gallery</p>
    <h2 class="section-title" style="text-align:center;color:#fff">フォトギャラリー</h2>
    <div class="section-divider" style="margin:1.5rem auto"></div>
  </div>
  <div class="gallery-grid fade-up">
    ${galleryGrid(meta.galleryImgSrcs, meta.name)}
  </div>
</section>

<!-- INFO -->
<section id="info">
  <div class="info-grid">
    <div class="fade-left">
      <p class="section-label">Shop Info</p>
      <h2 class="section-title">店舗情報</h2>
      <div class="section-divider"></div>
      <table class="info-table">
        ${meta.address ? `<tr><th>住所</th><td>${meta.address}</td></tr>` : ''}
        ${meta.phone ? `<tr><th>電話番号</th><td><a href="tel:${phoneClean}" style="color:var(--accent);font-weight:600">${meta.phone}</a></td></tr>` : ''}
        ${meta.hours ? `<tr><th>営業時間</th><td style="white-space:pre-line">${meta.hours}</td></tr>` : ''}
        ${meta.priceRange ? `<tr><th>価格帯</th><td>${meta.priceRange}</td></tr>` : ''}
        ${meta.seats ? `<tr><th>席数</th><td>${meta.seats}</td></tr>` : ''}
        ${meta.access ? `<tr><th>アクセス</th><td>${meta.access}</td></tr>` : ''}
      </table>
    </div>
    <div class="fade-right">
      <div class="info-links">
        ${phoneClean ? `<a href="tel:${phoneClean}" class="info-link-btn btn-tel">📞 ${meta.phone || 'お電話でご予約'}</a>` : ''}
        ${meta.tabelogUrl ? `<a href="${meta.tabelogUrl}" target="_blank" class="info-link-btn btn-tabelog">🍽 食べログで見る</a>` : ''}
        ${meta.googleMapsUrl ? `<a href="${meta.googleMapsUrl}" target="_blank" class="info-link-btn btn-gmap">📍 Google マップ</a>` : ''}
      </div>
      ${ratingNum > 0 ? `
      <div class="rating-wrap">
        <div class="rating-stars">${stars}</div>
        <div class="rating-score">${meta.rating} <span style="font-size:1rem;color:#888">/ 5.0</span></div>
        <div style="font-size:.8rem;color:#999;margin-top:.3rem">食べログ評価</div>
      </div>` : ''}
    </div>
  </div>
</section>

<!-- ACCESS -->
${meta.mapsEmbedSrc ? `
<section id="access">
  <div class="inner">
    <div class="fade-up">
      <p class="section-label">Access</p>
      <h2 class="section-title">アクセス</h2>
      <div class="section-divider"></div>
    </div>
    <div class="access-grid">
      <div class="fade-left">
        ${meta.address ? `<div class="access-address">📍 ${meta.address}</div>` : ''}
        ${meta.access ? `<div class="access-detail">🚃 ${meta.access}</div>` : ''}
        ${meta.hours ? `<div class="access-detail" style="margin-top:1rem;white-space:pre-line">🕐 ${meta.hours}</div>` : ''}
        ${meta.googleMapsUrl ? `<a href="${meta.googleMapsUrl}" target="_blank" class="btn-primary" style="margin-top:2rem;display:inline-flex">Google マップで開く →</a>` : ''}
      </div>
      <div class="access-map fade-right">
        <iframe src="${meta.mapsEmbedSrc}" width="100%" height="400" style="border:0;" allowfullscreen loading="lazy"></iframe>
      </div>
    </div>
  </div>
</section>` : ''}

<!-- CTA -->
<section id="cta">
  <div class="fade-up">
    <h2 class="cta-title">ご予約・お問い合わせ</h2>
    <p class="cta-sub">皆様のご来店を心よりお待ちしております</p>
    ${phoneClean ? `
    <div class="cta-phone">${meta.phone}</div>
    <p class="cta-hours">${meta.hours ? meta.hours.split('\n')[0] : '営業時間内にお電話ください'}</p>
    <div class="cta-btns">
      <a href="tel:${phoneClean}" class="btn-primary" style="font-size:1.1rem;padding:1rem 2.5rem">📞 今すぐ電話する</a>
      ${meta.tabelogUrl ? `<a href="${meta.tabelogUrl}" target="_blank" class="btn-outline">食べログで予約</a>` : ''}
    </div>` : `
    <div class="cta-btns">
      ${meta.tabelogUrl ? `<a href="${meta.tabelogUrl}" target="_blank" class="btn-primary">食べログで予約する</a>` : ''}
      ${meta.googleMapsUrl ? `<a href="${meta.googleMapsUrl}" target="_blank" class="btn-outline">Google マップで確認</a>` : ''}
    </div>`}
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-grid">
    <div>
      <div class="footer-brand">${meta.name}</div>
      <p class="footer-tagline">${content.tagline}<br>${meta.address || ''}</p>
    </div>
    <div class="footer-nav">
      <div class="footer-nav-title">メニュー</div>
      <ul>
        <li><a href="#about">コンセプト</a></li>
        <li><a href="#menu">メニュー</a></li>
        <li><a href="#gallery">ギャラリー</a></li>
        <li><a href="#info">店舗情報</a></li>
        <li><a href="#access">アクセス</a></li>
      </ul>
    </div>
    <div class="footer-nav">
      <div class="footer-nav-title">お問い合わせ</div>
      <ul>
        ${phoneClean ? `<li><a href="tel:${phoneClean}">${meta.phone}</a></li>` : ''}
        ${meta.tabelogUrl ? `<li><a href="${meta.tabelogUrl}" target="_blank">食べログ</a></li>` : ''}
        ${meta.googleMapsUrl ? `<li><a href="${meta.googleMapsUrl}" target="_blank">Google マップ</a></li>` : ''}
      </ul>
    </div>
  </div>
  <div class="footer-bottom">© 2025 ${meta.name}. All rights reserved.</div>
</footer>

<!-- LIGHTBOX -->
<div id="lightbox" onclick="closeLightbox()">
  <button id="lightbox-close" onclick="closeLightbox()">✕</button>
  <img id="lightbox-img" src="" alt="">
</div>

<script>
// Nav scroll effect
const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60)
  // Parallax
  const heroBg = document.getElementById('hero-bg')
  if (heroBg) heroBg.style.transform = 'translateY(' + window.scrollY * 0.4 + 'px)'
})

// Hamburger
const hamburger = document.getElementById('hamburger')
const mobileMenu = document.getElementById('mobile-menu')
hamburger.addEventListener('click', () => mobileMenu.classList.toggle('open'))
function closeMobile() { mobileMenu.classList.remove('open') }

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
}, { threshold: 0.12 })
document.querySelectorAll('.fade-up,.fade-left,.fade-right').forEach(el => observer.observe(el))

// Lightbox
function openLightbox(src) {
  document.getElementById('lightbox-img').src = src
  document.getElementById('lightbox').classList.add('open')
  document.body.style.overflow = 'hidden'
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open')
  document.body.style.overflow = ''
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox() })
</script>
</body>
</html>`
}
