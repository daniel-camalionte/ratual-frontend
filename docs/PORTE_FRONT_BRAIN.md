# Porte do frontend Brain para o Ratual — convenções

Origem (só leitura): `C:\GIT\brain\brain-frontend\src` (React + Tailwind + lucide, token em localStorage).
Destino: este repositório (React 19 + TS + MaterialPro/Bootstrap 5, **mobile primeiro**, sessão em cookie HttpOnly).
Backend: `C:\GIT\ratual\ratual-backend` (Swagger local em http://localhost:8000/api/docs/swagger; rotas em `app/api/v1/*.py`,
schemas Pydantic em `app/schemas/*.py` = formato exato das respostas). Rode o backend com
`cd ..\ratual-backend && set RATUAL_ENV=stg && .venv\Scripts\python.exe wsgi.py` (já pode estar rodando na porta 8000, lendo o STG).

## Base pronta (NÃO edite): `src/lib/api.ts`, `src/lib/auth.tsx`, `src/lib/useApi.ts`, `src/config/*`, `src/App.tsx`, `src/layouts/*`, `src/components/layout/*`, `src/assets/css/*`

- `api.get/post/put/patch/delete(path, schema?, {query, signal})` — path começa em `/v1/...` (o `/api` vem do proxy). 4xx traz a
  mensagem em português do backend em `ApiError.message` (e `.code`); 5xx/rede = mensagem genérica. Escritas sempre enviam JSON.
- `useApi<T>(path | null, {refreshMs})` → `{data, loading, error, reload}`.
- `useAuth()` → `{user, isMaster, isAdmin, solicitarCodigo, verificarCodigo, logout, setUser}` (login sem senha: e-mail + código de 6 dígitos); `user` = `{id_usuario, nome, login, telefone, perfil, empresa:{id_empresa,nome,tipo}}`.
- Rotas e menu já existem (`/`, `/refrigeradores`, `/refrigeradores/:id`, `/alertas`, `/cameras`, `/servicos`, `/gestao`, `/conta`, `/login`)
  com páginas provisórias em `src/pages/<Nome>Page.tsx` (`export default`): substitua o conteúdo da(s) sua(s) página(s).
- Componentes do template em `src/components/{ui,forms,data,charts}` (Card, Button, Badge, Alert, Modal, Tabs, DataTable, Fields, Chart, Icon...). Reuse
  antes de criar. Antes de criar componente visual novo, consulte o padrão do MaterialPro (CLAUDE.md, seção "Base de conhecimento visual").

## Regras
- **MOBILE PRIMEIRO** (CLAUDE.md): projete em 360–430px antes do desktop; sem overflow horizontal, alvos ≥ 44px, inputs 16px, tabelas viram cartões
  (`DataTable`), modais em tela cheia no celular, cards de métrica em 1 coluna. Teste mentalmente também em 320px.
- Mesmos recursos e regras do Brain (campos, permissões, textos em português); a UI usa o visual do Ratual (MaterialPro), não o Tailwind do Brain.
- Sem `localStorage` para dados de sessão/usuário, sem `dangerouslySetInnerHTML`, sem CDN, sem `fetch` direto (só `lib/api`). Valide respostas com zod quando o formato for estável.
- Dados por empresa/perfil vêm filtrados do backend; a UI só esconde o que o perfil não pode (admin/master via `useAuth`).
- Ícones: use `<Icon name="..."/>` com nomes do Tabler (ex.: `fridge`, `video`, `bell-ringing`, `tool`, `settings`, `user`, `plus`, `pencil`, `trash`, `refresh`...). NÃO rode `npm run icons` (o coordenador regenera o subconjunto no fim).
- Cada módulo cria seus arquivos: `src/features/<modulo>/` (componentes, hooks, tipos, **`<modulo>.css` importado pela própria página**). Não edite `app.css` nem arquivos compartilhados;
  se faltar algo neles, liste no relatório.
- Testes (vitest + testing-library) em `src/test/<modulo>.test.tsx`: mocke `@/lib/api` (`vi.mock('@/lib/api', ...)` com `api.get/post/...` e `ApiError`) e renderize dentro de `MemoryRouter` + `AuthProvider`
  (o AuthProvider chama `GET /v1/auth/me`: faça o mock devolver um usuário). Cubra: renderiza com dados, estado vazio/erro, a interação principal, e o que muda por perfil.
- Valide com, a partir de um terminal com drive em maiúscula (`C:\GIT\ratual\ratual-frontend`): `npx tsc -b --noEmit`, `npx eslint src`, `npx vitest run --root "C:/GIT/ratual/ratual-frontend"`.
  Se um erro vier de arquivo de outro agente (trabalham em paralelo), ignore-o e cite no relatório.
- Dados reais do STG para conferir formatos: `curl` com cookie (o login exige código enviado ao e-mail real, que você não tem): confie nos schemas Pydantic e nos testes do backend (`tests/test_<modulo>.py`).
