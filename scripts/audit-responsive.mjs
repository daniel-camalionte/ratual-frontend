// Auditoria de responsivo (mobile primeiro). Requer, fora do package.json: npm i --no-save playwright && npx playwright install chromium
// Uso: npm run dev (outro terminal) e então: node scripts/audit-responsive.mjs [larguras] [rota]   ex.: node scripts/audit-responsive.mjs 320,390 /tabelas
// Falha se qualquer rota tiver scroll horizontal, elemento fora da tela, texto cortado sem reticências ou erro de console.
import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3000'
const ROUTES = ['/', '/formularios/basico', '/formularios/validacao', '/tabelas', '/graficos', '/ui/botoes', '/ui/cards', '/ui/modais', '/login', '/registro']
const WIDTHS = (process.argv[2] ?? '320,360,390,412,768').split(',').map(Number)
const only = process.argv[3]

const browser = await chromium.launch()
let problems = 0
for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 1, isMobile: w < 700, hasTouch: w < 700 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  for (const r of ROUTES.filter((x) => !only || x === only)) {
    await page.goto(BASE + r, { waitUntil: 'networkidle' })
    await page.waitForTimeout(1800)
    const res = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth
      const bad = []
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        if (el.closest('.visually-hidden, .offcanvas, svg, .apexcharts-canvas, .table-responsive, .modal')) continue
        const rect = el.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) continue
        if (rect.right > vw + 1 || rect.left < -1) {
          bad.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').slice(0, 2).join('.')} [${Math.round(rect.left)}..${Math.round(rect.right)}] "${(el.textContent || '').trim().slice(0, 24)}"`)
        }
      }
      // texto truncado sem querer (conteúdo maior que a caixa, sem text-overflow)
      const clipped = []
      for (const el of document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,small,label,a,button,div')) {
        if (el.children.length) continue
        const cs = getComputedStyle(el)
        if (!el.closest('.visually-hidden') && cs.overflow === 'hidden' && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) clipped.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]} "${(el.textContent || '').trim().slice(0, 24)}"`)
      }
      return { scrollW: document.documentElement.scrollWidth, vw, bad: bad.slice(0, 6), clipped: clipped.slice(0, 4) }
    })
    const flag = res.scrollW > res.vw + 1 || res.bad.length || res.clipped.length || errors.length
    if (flag) {
      problems++
      console.log(`✗ ${w}px ${r}: scroll ${res.scrollW}/${res.vw}`, res.bad.length ? '\n    vazando: ' + res.bad.join(' | ') : '', res.clipped.length ? '\n    cortado: ' + res.clipped.join(' | ') : '', errors.length ? '\n    erros: ' + errors.slice(0, 2).join(' | ') : '')
      errors.length = 0
    }
  }
  if (w === WIDTHS[0] || w === 390) {
    await page.goto(BASE + '/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2600)
    await page.screenshot({ path: `.audit-${w}.png`, fullPage: false })
  }
  await ctx.close()
}
await browser.close()
console.log(problems === 0 ? `✓ sem problemas em ${WIDTHS.join(', ')}px (${ROUTES.length} rotas)` : `${problems} ocorrência(s)`)
