# Arquitetura do ratual-frontend

## Visão geral

SPA estática (React 19, TypeScript, Vite 8) servida pelo Apache da KingHost. A API Flask roda em `/api` no **mesmo domínio**,
então não há CORS em produção e a sessão pode ser um cookie `HttpOnly` definido pelo backend.

```
Navegador ──► Apache (KingHost)
               ├─ /          → dist/ (index.html + assets com hash, fallback SPA)
               └─ /api/...   → mod_wsgi (ratual-backend, Flask)
```

Em desenvolvimento: `npm run dev` (porta 3000) com proxy `/api` → `127.0.0.1:8000`, reproduzindo a mesma origem.

## Camadas

| Pasta | Papel |
|---|---|
| `components/ui` | Átomos: Button, Card, Badge, Alert, Avatar, ProgressBar, Modal, Tabs, Pagination, StatCard, PageHeader, Icon |
| `components/forms` | `Fields`: TextField, TextAreaField, SelectField, CheckField (radio/checkbox/switch) para react-hook-form |
| `components/data` | `DataTable` (busca, ordenação, paginação, sem jQuery) |
| `components/charts` | `Chart` (ApexCharts em chunk separado, `aria-label` obrigatório) |
| `components/layout` | Topbar, HorizontalNav (CSS do template), MobileNav (offcanvas) |
| `layouts` | `AppLayout` (autenticado), `AuthLayout` (login/registro) |
| `features/<dominio>` | Código de um domínio do produto: tipos, dados (mock hoje), hook de dados e componentes próprios. Hoje: `monitoramento` (dashboard de refrigeradores) |
| `pages` | Uma rota = uma página (`export default`), sempre `lazy` |
| `lib` | `api` (cliente HTTP), `auth`, `theme`, `format` |
| `config/nav.ts` | Fonte única do menu |

## Decisões

- **React + Vite + TS estrito** (`noUncheckedIndexedAccess`): substitui as ~127 páginas HTML/jQuery por componentes reutilizáveis.
- **CSS do template, não reescrito**: `template.css` (Bootstrap 5 + tema) preserva o visual; `scripts/build-icons.mjs` o limpa (sem `@import` do Google, sem as 3000 regras de ícones).
- **react-bootstrap só para comportamento** (Modal, Dropdown, Offcanvas): acessível, sem jQuery nem `bootstrap.js`.
- **Ícones**: fonte Tabler **reduzida** aos ícones usados (653 KB → ~9 KB). Os ícones Solar do template (Iconify/CDN) não são usados.
- **Poppins local** (5 pesos, latin, woff2): sem Google Fonts.
- **Sem biblioteca de estado/dados por enquanto**: estado local + `lib/api`. Adotar TanStack Query quando houver muitas telas com cache/revalidação.
- **Tabelas no cliente** servem para listas pequenas; volumes grandes exigem paginação/ordenação **no backend**.

## Segurança

- Sessão por cookie `HttpOnly` (backend). Nada sensível em `localStorage` (só o tema).
- `lib/api`: mesma origem, `credentials: same-origin`, `X-Requested-With`, timeout de 15 s, erros genéricos, resposta validada com zod, só caminhos iniciados por `/`.
- CSP estrita em `public/.htaccess` (`script-src 'self'`; `'unsafe-inline'` só em estilos, exigido por atributos `style`/ApexCharts), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP.
- ESLint barra `dangerouslySetInnerHTML`, `eval`, `new Function`.
- Redirecionamento pós-login só para caminho interno.
- `ErrorBoundary` sem detalhes técnicos na tela.
- **Autenticação**: `AUTH_ENABLED` (`VITE_AUTH_ENABLED`) está **desligado** porque o backend ainda não tem `/v1/auth/login`; enquanto isso o app usa um usuário de demonstração e **qualquer pessoa acessa as telas**. Ligue antes de publicar dados reais. Esconder rotas no cliente não é autorização: a API valida cada requisição.

## Performance (medido no build)

| Item | Tamanho (gzip) |
|---|---|
| JS inicial (React, Router, react-bootstrap) | ~135 KB |
| CSS do template | ~82 KB |
| Fonte de ícones | ~9 KB |
| Poppins (5 pesos) | ~39 KB (woff2) |
| ApexCharts | ~283 KB, **só** ao abrir uma tela com gráfico |
| Cada página | 1–7 KB |

Próximos passos de performance: PurgeCSS validado visualmente no `template.css`; Brotli no servidor se a KingHost permitir; imagens em WebP.

## Backlog técnico

1. Login real (cookie + CSRF) quando o backend expuser `/v1/auth/*`; trocar o usuário demo.
2. Migrar as páginas pendentes (`docs/MIGRATION.md`), priorizando as do ERP (cadastros, listagens, apps).
3. Cliente tipado gerado do OpenAPI do backend.
4. Editor rico, calendário, upload: decidir biblioteca com o arquiteto (peso, segurança).
