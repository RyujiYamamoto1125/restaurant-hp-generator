export function injectWatermark(html: string, restaurantName: string): string {
  const watermarkHtml = `
<style>
#hp-demo-watermark {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9998;
  overflow: hidden;
}
#hp-demo-watermark::before {
  content: 'DEMO DEMO DEMO DEMO DEMO DEMO DEMO DEMO DEMO DEMO';
  position: absolute;
  inset: -50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 5rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.045);
  letter-spacing: .3em;
  white-space: nowrap;
  transform: rotate(-35deg);
  line-height: 2.2;
  word-spacing: 1rem;
  font-family: Arial, sans-serif;
}
#hp-demo-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  padding: 0;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
  font-family: 'Helvetica Neue', Arial, sans-serif;
}
#hp-demo-banner-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .85rem 5%;
  max-width: 1200px;
  margin: 0 auto;
}
#hp-demo-banner-text { flex: 1 }
#hp-demo-banner-tag {
  display: inline-block;
  background: #e94560;
  color: #fff;
  font-size: .7rem;
  font-weight: 800;
  padding: .2rem .6rem;
  border-radius: 3px;
  letter-spacing: .08em;
  margin-bottom: .3rem;
}
#hp-demo-banner-title {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: .1rem;
  letter-spacing: .02em;
}
#hp-demo-banner-sub {
  font-size: .8rem;
  color: rgba(255,255,255,.65);
}
#hp-demo-banner-price {
  text-align: center;
  flex-shrink: 0;
}
#hp-demo-banner-price .price-num {
  font-size: 1.6rem;
  font-weight: 800;
  color: #f5c842;
  letter-spacing: -.02em;
  line-height: 1;
}
#hp-demo-banner-price .price-label {
  font-size: .7rem;
  color: rgba(255,255,255,.6);
  margin-top: .1rem;
}
#hp-demo-cta {
  display: inline-flex;
  align-items: center;
  gap: .4rem;
  background: #e94560;
  color: #fff;
  padding: .75rem 1.5rem;
  border-radius: 3rem;
  font-weight: 800;
  font-size: .9rem;
  text-decoration: none;
  white-space: nowrap;
  flex-shrink: 0;
  transition: transform .2s, box-shadow .2s;
  box-shadow: 0 4px 16px rgba(233,69,96,.4);
}
#hp-demo-cta:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(233,69,96,.5) }
@media(max-width: 640px) {
  #hp-demo-banner-inner { flex-wrap: wrap; gap: .75rem }
  #hp-demo-banner-price { display: none }
  #hp-demo-cta { width: 100%; justify-content: center }
  #hp-demo-banner-title { font-size: .9rem }
}
body { padding-bottom: 100px !important }
</style>

<div id="hp-demo-watermark"></div>

<div id="hp-demo-banner">
  <div id="hp-demo-banner-inner">
    <div id="hp-demo-banner-text">
      <div id="hp-demo-banner-tag">DEMO版</div>
      <div id="hp-demo-banner-title">「${restaurantName}」様の公式HPデモです</div>
      <div id="hp-demo-banner-sub">初期費用0円・月額5,000円で本公開できます</div>
    </div>
    <div id="hp-demo-banner-price">
      <div class="price-num">¥5,000</div>
      <div class="price-label">/ 月（税込）</div>
    </div>
    <a href="mailto:willaughaffiliate1@gmail.com?subject=${encodeURIComponent(`【HP利用希望】${restaurantName}`)}&body=${encodeURIComponent(`このHPに興味があります。\n\n店舗名：${restaurantName}\nご連絡先：\nご希望：`)}"
       id="hp-demo-cta">
      📩 このHPを使いたい
    </a>
  </div>
</div>
`

  // </body>の直前に注入
  if (html.includes('</body>')) {
    return html.replace('</body>', watermarkHtml + '</body>')
  }
  return html + watermarkHtml
}
