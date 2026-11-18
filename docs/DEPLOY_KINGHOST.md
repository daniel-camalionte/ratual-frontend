# Deploy do frontend na KingHost (estático, FTP)

O frontend é só arquivos estáticos. A API é outra aplicação (`/api`, ver `ratual-backend/docs/DEPLOY_KINGHOST.md`).

## 1. Gerar o pacote (no PC)

```bash
npm ci            # ou npm install
npm run typecheck && npm run lint && npm test
npm run build     # gera dist/
npm run package   # lista o que enviar
```

`dist/` contém `index.html`, `favicon.png`, `assets/` (arquivos com hash) e dois `.htaccess`
(`dist/.htaccess` e `dist/assets/.htaccess`). **Os `.htaccess` fazem parte do deploy**: eles ligam HTTPS, o fallback do SPA,
a CSP e os demais cabeçalhos de segurança, e o cache. Habilite "mostrar arquivos ocultos" no cliente de FTP.

## 2. Primeira publicação

Envie **todo o conteúdo de `dist/`** (não a pasta `dist` em si) para a pasta pública do domínio (`www`/`public_html`).
Garanta que a aplicação WSGI `api` esteja no mesmo domínio (`/api`). O `.htaccess` já deixa `/api` fora das regras do SPA.

## 3. Atualizações

`npm run build && npm run package` mostra **NOVOS / ALTERADOS / REMOVIDOS** desde o último pacote.
Envie os novos/alterados, apague os removidos e envie o `index.html` **por último**.
Arquivos em `assets/` têm hash: nunca sobrescrevem versões antigas, então usuários com a página aberta não quebram.
Reverter = reenviar o `index.html` anterior.

## 4. Verificar

```bash
curl -I https://<dominio>/            # 200, Content-Security-Policy, Strict-Transport-Security, X-Frame-Options
curl -I https://<dominio>/formularios/basico   # 200 (fallback do SPA)
curl -s https://<dominio>/api/v1/hello         # JSON do backend
```

Abra o console do navegador: não pode haver violações de CSP. Se adicionar um recurso externo, declare a origem na CSP em `public/.htaccess`.

## 5. Antes de publicar com dados reais

- `VITE_AUTH_ENABLED=true` no build e login funcionando no backend (hoje as telas são abertas).
- Rotas sensíveis protegidas **na API**.
