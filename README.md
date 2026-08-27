# Eleven Hub

CRM e plataforma de gestão operacional da **Eleven Contabilidade & Consultoria** — cobre a jornada completa do cliente (Lead → Prospecção → Fechamento → Onboarding → Cliente Ativo → Operação → Financeiro) em uma única aplicação.

Construído com Next.js (App Router) + TypeScript + Tailwind CSS. Os dados são mockados e mantidos em `localStorage` via Zustand, prontos para serem substituídos por uma API real.

## Começando

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Na tela de login, use a aba **Sou da equipe** e selecione qualquer colaborador no seletor "Entrar como (demo)" — e-mail/senha não são validados nesta versão de demonstração.

## Estrutura

- `src/app/(app)` — páginas autenticadas da equipe (dashboard, comercial, clientes, tarefas, obrigações, financeiro, relatórios, etc.), todas atrás do layout com sidebar/topbar.
- `src/app/login`, `src/app/portal` — login (equipe/cliente) e portal simplificado do cliente.
- `src/components/ui` — kit de componentes (botões, cards, tabelas, diálogos, etc.) no estilo shadcn.
- `src/components/{crm,clients,departments,dashboard,layout,tasks}` — componentes específicos de cada módulo.
- `src/lib/types.ts` — modelo de dados do domínio (leads, clientes, tarefas, obrigações, certificados, financeiro...).
- `src/lib/data/seed.ts` — dados fictícios usados para popular a demonstração.
- `src/lib/store` — stores Zustand (`app-store` para os dados, `auth-store` para a sessão), persistidos em `localStorage`.

## Identidade visual

Paleta em tons de vinho, bege/off-white e cinza claro, definida em `src/app/globals.css` (`--color-wine-*`, `--color-cream-*`, `--color-sand-*`). A marca (`src/components/brand/logo.tsx`) é uma recriação vetorial do logotipo da Eleven — substitua pelo arquivo vetorial oficial quando disponível.

## Scripts

```bash
npm run dev     # ambiente de desenvolvimento
npm run build   # build de produção
npm run lint    # ESLint
```
