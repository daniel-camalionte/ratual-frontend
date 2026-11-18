// Gera (a) src/assets/css/template.css sem a fonte/regras de icones e sem @import externo e
// (b) um subconjunto da fonte Tabler so com os icones usados em src/ (icons.css + woff2).
// Fonte original: template-legacy/ (mantido so como referencia). Rodar: npm run icons
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const LEGACY_CSS = join(ROOT, 'template-legacy/assets/css/styles.css')
const LEGACY_FONT = join(ROOT, 'template-legacy/assets/fonts/tabler-icons/fonts/tabler-icons.ttf')
const OUT_CSS = join(ROOT, 'src/assets/css/template.css')
const OUT_ICONS_CSS = join(ROOT, 'src/assets/css/icons.css')
const OUT_FONT_DIR = join(ROOT, 'src/assets/fonts/tabler-icons')

let css = readFileSync(LEGACY_CSS, 'utf8')

// 1) mapa nome -> codepoint
const RULE = /\.ti-([a-z0-9-]+):before\{content:"\\([0-9a-f]+)"\}/g
const map = new Map()
for (const m of css.matchAll(RULE)) map.set(m[1], m[2])

// 2) icones usados: toda string literal em src/ que seja nome de icone conhecido
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(f) ? [p] : []
  })
}
const used = new Set(['circle']) // usado por classes internas do template
for (const file of walk(join(ROOT, 'src')).filter((f) => /\.tsx?$/.test(f))) {
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(/(['"`])([a-z0-9-]+)\1/g)) if (map.has(m[2])) used.add(m[2])
  for (const m of src.matchAll(/\bti-([a-z0-9-]+)/g)) if (map.has(m[1])) used.add(m[1])
}

// 3) template.css limpo
css = css
  .replace(/@import url\(https:\/\/fonts\.googleapis\.com[^)]*\);?/g, '')
  .replace(/@font-face\{font-family:tabler-icons[^}]*\}/g, '')
  .replace(/\.ti-[a-z0-9-]+:before\{content:"\\[0-9a-f]+"\}/g, '')
  .replace(/\.ti\{font-family:tabler-icons!important;[^}]*\}/g, '')
writeFileSync(OUT_CSS, css)

// 4) fonte reduzida + icons.css
mkdirSync(OUT_FONT_DIR, { recursive: true })
const unicodes = [...used].map((n) => 'U+' + map.get(n)).join(',')
const outFont = join(OUT_FONT_DIR, 'tabler-icons.subset.woff2')
// Requer: pip install fonttools brotli  (use PYTHON=caminho/do/python se necessario)
execFileSync(process.env.PYTHON ?? 'python', ['-m', 'fontTools.subset', LEGACY_FONT, '--unicodes=' + unicodes, '--flavor=woff2', '--layout-features=', '--no-hinting', '--output-file=' + outFont], { stdio: 'inherit' })
const font = readFileSync(outFont)

const rules = [...used].sort().map((n) => `.ti-${n}:before{content:"\\${map.get(n)}"}`).join('\n')
writeFileSync(
  OUT_ICONS_CSS,
  `/* GERADO por scripts/build-icons.mjs — nao edite. */
@font-face{font-family:tabler-icons;font-style:normal;font-weight:400;font-display:block;src:url(../fonts/tabler-icons/tabler-icons.subset.woff2) format("woff2")}
.ti{font-family:tabler-icons!important;speak:none;font-style:normal;font-weight:400;font-variant:normal;text-transform:none;line-height:1;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
${rules}
`,
)
console.log(`${used.size} icones; fonte ${(font.length / 1024).toFixed(1)} KB; template.css ${(css.length / 1024).toFixed(0)} KB`)
