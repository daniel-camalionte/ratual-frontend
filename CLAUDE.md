# ratual-frontend

SPA do ERP Ratual: **React 19 + TypeScript + Vite**, visual do template MaterialPro (Bootstrap 5). Hospedagem **estática**
na KingHost (Apache, deploy por FTP); a API (`../ratual-backend`, Flask) fica em `/api` no mesmo domínio.
Prioridades: **segurança e performance**.

## Comandos

```bash
npm install
npm run dev          # http://localhost:3000 (proxy /api -> http://127.0.0.1:8000)
npm run typecheck && npm run lint && npm test
npm run build        # gera dist/ (index.html, assets/ com hash, .htaccess)
npm run package      # lista novos/alterados/removidos desde o ultimo pacote (para o FTP)
npm run icons        # regenera o subset de icones e o template.css (requer: pip install fonttools brotli)
```

No Windows, rode os comandos a partir de um terminal cujo diretório tenha a letra do drive em **maiúscula** (`C:\...`);
com `c:\...` o Vitest carrega o módulo duas vezes e falha.

## Base de conhecimento visual

Antes de criar um componente novo (gráfico, grid, card), consulte como o template faz algo parecido, para manter a identidade:
https://bootstrapdemos.wrappixel.com/materialpro/dist/horizontal/index5.html (menu com ~127 páginas) — cópia local completa em `template-legacy/`
(HTML em `horizontal/`, configs de gráficos em `assets/js/dashboards/` e `assets/js/apex-chart/`). Paleta: primary `#1B84FF`, ciano `#43CED7`, roxo `#7460EE`; Poppins; cards arredondados com sombra suave; curvas suaves com degradê.

## Produto

Nome: **Refrigeração Atual**. Marca = `components/ui/Brand.tsx` (ícone SVG `LogoMark` recriado do logotipo + texto real; padrão do logo do MaterialPro: fonte **Roboto** (local, `assets/fonts/roboto`), **CAIXA ALTA**, "REFRIGERAÇÃO" em **peso 600** e "ATUAL" em peso **270** (muito leve, como o "PRO"); medidas calibradas no template: caixa alta de 12,8px (Roboto 18px), 16px entre ícone e texto, ícone ~23px de altura, texto centralizado no ícone; em telas < 390px o texto vai em duas linhas). No cabeçalho (topbar azul **chapada**, como o MaterialPro) o ícone e o texto são **brancos e sem degradê** (`<Brand light />`); sobre fundo claro (login) usa a cor ciano da marca. KPIs seguem o padrão discreto do template: círculo sólido com ícone branco + valor + rótulo, **um embaixo do outro no celular**.
O Ratual monitora refrigeradores/câmaras frias (temperatura, compressor, alertas, offline). O dashboard (`src/features/monitoramento/`, rota `/`) é o item de maior impacto visual: caprichar em gráficos, animações e acabamento — sempre mobile primeiro. Dados são **simulados** em `features/monitoramento/mock.ts` até o backend existir (trocar só `useMonitoramento.ts`).

## Agentes especialistas

- `.claude/agents/ratual-front-arquiteto.md`: arquitetura, segurança, performance e acessibilidade. Use antes de criar
  páginas/componentes/dependências e para revisar diffs.
- `.claude/agents/ratual-front-migrador.md`: migra páginas de `template-legacy/` para React seguindo `docs/MIGRATION.md`.

## Estrutura

`src/components/{ui,forms,data,charts,layout}` · `src/layouts` · `src/pages` (uma rota = uma página, `export default`, `lazy`) ·
`src/lib` (api, auth, tema, format) · `src/config/nav.ts` (menu) · `template-legacy/` (HTML original, **só referência**).
Docs: `docs/ARCHITECTURE.md`, `docs/MIGRATION.md`, `docs/DEPLOY_KINGHOST.md`.

## Regras

- **MOBILE PRIMEIRO (prioridade máxima)**: o celular é o uso principal. Projete em 360–430px antes do desktop e compare com a página equivalente de `template-legacy/` (a meta é igualar ou superar o template). Sem overflow horizontal, sem texto/ícone cortado, alvos de toque ≥ 44px, inputs com fonte 16px, cards de métrica em 1 coluna no celular, tabelas viram cartões (`DataTable` já faz), modais em tela cheia, gráficos sem rótulos sobrepostos. CSS próprio em `src/assets/css/app.css` (base = celular; `min-width` amplia). **Valide com screenshot real** (Playwright, viewport 390×844 e 1366×768) e rode `node scripts/audit-responsive.mjs` (larguras 320/360/390/412/768 em todas as rotas) antes de entregar; precisa passar limpo. Teste sempre também em **320px** (o menor celular).

- **Sem dado sensível no navegador**: nada de token/código/PII em `localStorage`/`sessionStorage`. Sessão = cookie HttpOnly do backend.
- **Proibido**: `dangerouslySetInnerHTML` (ESLint barra), `innerHTML`, `eval`, scripts/estilos inline no `index.html`, CDN (CSP `default-src 'self'`), `fetch` direto.
- **API só por `lib/api.ts`** (timeout, mesma origem, erro genérico). Valide respostas com zod. Autorização é do backend.
- **`VITE_*` é público** (vai no bundle): nunca coloque segredo.
- **Formulários**: react-hook-form + zod + `components/forms/Fields`; o backend revalida tudo.
- **Redirecionamento** só para caminho interno (veja `safePath` em `LoginPage`).
- **Performance**: toda página com `lazy`; libs pesadas por import dinâmico; bundle inicial ≤ ~150 KB gzip de JS; imagens com `width`/`height`.
- **Ícones**: `<Icon name="home"/>` (Tabler, local). Ícone novo → `npm run icons`.
- **Rota nova**: página + `<Route>` em `App.tsx` + `config/nav.ts` + `docs/MIGRATION.md` + teste.
- **Dependências**: fixe via `package-lock.json`; antes de adicionar, avalie tamanho gzip e `npm audit`.
- **Testes**: toda página/componente novo vem com teste (renderiza + interação principal + estado de erro).
- **Dados de exemplo** são demonstração; nunca coloque dados reais em arquivos versionados.
- **Commits**: mensagens em português, no imperativo, escopo claro.
