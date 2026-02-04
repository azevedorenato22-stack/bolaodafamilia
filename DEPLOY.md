# Guia de Deploy - Bolão Amigos

Este projeto é um monorepo contendo um Frontend (Next.js) e um Backend (NestJS). Para colocar em produção na Vercel, siga os passos abaixo.

## 1. Banco de Dados (Vercel Postgres)

Vamos utilizar o **Vercel Postgres**, que é a opção integrada e mais fácil.

1.  No painel da Vercel, vá até a aba **Storage**.
2.  Clique em **Create Database** e selecione **Postgres**.
3.  Dê um nome (ex: `bolao-db`) e selecione a região (ex: `Washington, D.C. - iad1` ou `São Paulo`, se disponível).
4.  Após criar, vá nas configurações do banco, seção **.env.local**.
5.  Copie os valores, principalmente:
    *   `POSTGRES_URL` (ou `DATABASE_URL`)
    *   `POSTGRES_PRISMA_URL` (se tiver essa variação para o Prisma)
    *   `POSTGRES_URL_NON_POOLING`
6.  Nas variáveis de ambiente do projeto `api`, usaremos a `POSTGRES_PRISMA_URL` (ou a `DATABASE_URL` padrão) como valor para `DATABASE_URL`.

## 2. Publicando o Backend (`apps/api`)

O backend foi adaptado para rodar como Serverless Function.

1.  No painel da Vercel, clique em **Add New Project**.
2.  Importe o repositório do Git.
3.  Configure o projeto:
    *   **Framework Preset**: Other
    *   **Root Directory**: `apps/api` (Clique em Edit)
    *   **Build Command**: `npx turbo run build --filter=api` (ou deixe o padrão se detectar NestJS, mas garanta que ele instale as deps)
        *   *Dica*: Se der erro, pode usar `cd ../.. && npm install && npm run build:api` como comando customizado, mas geralmente a Vercel detecta monorepos.
    *   **Output Directory**: `dist`
4.  **Environment Variables**:
    *   `DATABASE_URL`: (Sua URL do banco)
    *   `JWT_SECRET`: (Gere uma string aleatória)
    *   `CORS_ORIGINS`: `https://seu-frontend.vercel.app` (Você adicionará isso depois de publicar o front, por enquanto coloque `*`)
5.  Clique em **Deploy**.
6.  Copie a URL gerada (ex: `https://bolao-api.vercel.app`).

## 3. Publicando o Frontend (`apps/web`)

1.  No painel da Vercel, clique em **Add New Project** (novamente, importando o mesmo repo).
2.  Configure o projeto:
    *   **Framework Preset**: Next.js
    *   **Root Directory**: `apps/web` (Clique em Edit)
3.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: A URL do backend que você acabou de copiar (ex: `https://bolao-api.vercel.app`) - **Importante: não coloque a barra `/` no final se o código concatenar com `/api`**.
4.  Clique em **Deploy**.

## 4. Finalização

1.  Volte no projeto do **Backend** na Vercel.
2.  Atualize a variável `CORS_ORIGINS` com a URL do seu Frontend oficial.
3.  Redeploy o backend (Promote to Production).
4.  Rode as migrações do banco de dados localmente apontando para produção ou configure um comando de post-install (avançado).
    *   *Localmente*: Crie um arquivo `.env` com a `DATABASE_URL` de produção e rode:
        `npm run db:migrate` ou `npx turbo run db:migrate` (dependendo dos scripts na raiz).

## Checklist de Entrega

- [ ] API Deployada e retornando status 200/404 (e não 500).
- [ ] Frontend Deployado e carregando.
- [ ] Login/Cadastro funcionando (conecta no banco).
