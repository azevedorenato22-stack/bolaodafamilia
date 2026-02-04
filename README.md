# Bolão dos Amigos

Sistema de bolões esportivos para apostas entre amigos. Permite criar múltiplos bolões, fazer palpites de resultados de jogos e acompanhar rankings com pontuação automática.

## Sobre o Projeto

Este é um **projeto freelance** desenvolvido para facilitar a gestão de bolões esportivos entre grupos de amigos. O sistema oferece funcionalidades como:

- Criação e gerenciamento de múltiplos bolões
- Cadastro de jogos e times
- Sistema de palpites com bloqueio automático (15 minutos antes do início do jogo)
- Ranking automático com pontuação configurável
- Painel administrativo completo

## Stack Tecnológica

- **Arquitetura**: Turborepo (Monorepo)
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: NestJS 10
- **Banco de Dados**: PostgreSQL + Prisma 5
- **Autenticação**: JWT + Passport

## Estrutura do Projeto

```
apps/
  ├── web/          # Frontend Next.js
  └── api/          # Backend NestJS
packages/
  ├── database/     # Prisma Schema + Migrations
  └── shared/       # Tipos TypeScript compartilhados
```

## Requisitos

- Node.js >= 18.0.0
- PostgreSQL
- npm >= 9.0.0

## Comandos Principais

```bash
npm install           # Instala dependências
npm run dev           # Inicia frontend + backend
npm run db:generate   # Gera Prisma Client
npm run db:push       # Sincroniza schema com o banco
npm run db:seed       # Popula dados iniciais
```

---

**Desenvolvido como projeto freelance** para o Bolão do Chuveiro Ligado.
