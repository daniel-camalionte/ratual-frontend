# ratual-frontend

Frontend do ERP Ratual — React 19 + TypeScript + Vite, com o visual do template MaterialPro (Bootstrap 5).

## Rodando

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run dev               # http://localhost:3000  (proxy /api → http://127.0.0.1:8000)
```

Suba também o backend (`ratual-backend`: `python wsgi.py`) para o proxy `/api` responder.

## Qualidade

```bash
npm run typecheck && npm run lint && npm test
npm run build             # dist/
```

## O que existe

- **Layout**: topbar (tema claro/escuro, notificações, usuário), menu horizontal, menu mobile, rodapé.
- **Componentes**: Button, Card, StatCard, Badge, Alert, Avatar, ProgressBar, Modal, Tabs, Pagination, PageHeader, Icon,
  Fields (texto, área, select, check/radio/switch), DataTable, Chart.
- **Páginas**: painel, formulários (básico e com validação), tabelas, gráficos, componentes de UI, login e registro.
- **Segurança e performance**: ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- **Migração do template**: ver [docs/MIGRATION.md](docs/MIGRATION.md) (o HTML original está em `template-legacy/`, só como referência).

## Deploy

[docs/DEPLOY_KINGHOST.md](docs/DEPLOY_KINGHOST.md). Convenções para agentes: [CLAUDE.md](CLAUDE.md).
