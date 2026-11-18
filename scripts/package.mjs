// Mostra o que mudou em dist/ desde o ultimo pacote, para enviar por FTP so o necessario.
//   npm run build && npm run package
// O manifesto anterior fica em .package/manifest.json (nao versionado).
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const DIST = join(ROOT, 'dist')
const STATE = join(ROOT, '.package')
const MANIFEST = join(STATE, 'manifest.json')

if (!existsSync(DIST)) {
  console.error('dist/ nao existe. Rode "npm run build" antes.')
  process.exit(1)
}

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const current = {}
for (const file of walk(DIST)) {
  current[relative(DIST, file).split('\\').join('/')] = createHash('sha256').update(readFileSync(file)).digest('hex')
}

const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : null
const added = Object.keys(current).filter((k) => !previous || !(k in previous))
const changed = previous ? Object.keys(current).filter((k) => k in previous && previous[k] !== current[k]) : []
const removed = previous ? Object.keys(previous).filter((k) => !(k in current)) : []

console.log(`Pacote em: ${DIST}  (${Object.keys(current).length} arquivos)`)
if (!previous) {
  console.log('\nPrimeiro pacote: envie TUDO de dist/ (inclusive .htaccess e assets/.htaccess).')
} else {
  const show = (title, list) => list.length && console.log(`\n${title} (${list.length}):\n  ${list.join('\n  ')}`)
  show('NOVOS (enviar)', added)
  show('ALTERADOS (enviar)', changed)
  show('REMOVIDOS (apagar no servidor)', removed)
  if (!added.length && !changed.length && !removed.length) console.log('\nNada mudou desde o ultimo pacote.')
  else console.log('\nSempre reenvie index.html por ultimo: ele aponta para os arquivos novos.')
}

mkdirSync(STATE, { recursive: true })
writeFileSync(MANIFEST, JSON.stringify(current, null, 2))
