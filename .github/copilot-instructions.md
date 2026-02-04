# Bolão dos Amigos - AI Development Guide

## Project Overview
Sistema de bolões esportivos com multi-bolão, palpites bloqueados por horário (15min antes), ranking automático e painel administrativo. Stack: **Turborepo monorepo** com Next.js 14 (frontend), NestJS 10 (backend), Prisma 5 + PostgreSQL.

## Architecture

### Monorepo Structure
```
apps/web/      → Next.js frontend (App Router, Tailwind CSS)
apps/api/      → NestJS backend (módulos por domínio)
packages/database/ → Prisma schema centralizado + migrations
packages/shared/   → Tipos TypeScript compartilhados
```

**Critical**: 
- `packages/database/prisma/schema.prisma` é a **fonte única de verdade** para o modelo de dados
- Sempre rodar `npm run db:generate` após mudanças no schema
- Tipos compartilhados em `packages/shared/src/` evitam duplicação entre frontend/backend

### Key Domain Models
- **Usuario**: `tipo` enum (ADMIN | USUARIO), controla permissões
- **Bolao**: pontuação configurável (`pts_resultado_exato`, `pts_vencedor_gols`, etc)
- **Jogo**: `status` enum (PALPITES → ANDAMENTO → ENCERRADO), `mata_mata` flag para pênaltis
- **Palpite**: constraint `@@unique([jogoId, usuarioId])`, bloqueio via `dataHora` do jogo

## Development Workflows

### Essential Commands
```bash
npm install           # Instala dependências do monorepo (workspaces)
npm run dev           # Inicia web + api simultaneamente (Turbo)
npm run dev:web       # Apenas frontend (localhost:3000)
npm run dev:api       # Apenas backend (localhost:3001)

# Database (Prisma)
npm run db:generate   # Gera Prisma Client (necessário após schema changes)
npm run db:push       # Sincroniza schema → PostgreSQL (dev only)
npm run db:migrate    # Cria migration versionada (production)
npm run db:studio     # Abre Prisma Studio (GUI)
npm run db:seed       # Popula dados iniciais (admin + usuários teste)
```

### Database Connection
`.env` na raiz: `DATABASE_URL="postgresql://postgres:123456@localhost:5432/bolaoamigos"`
Senha padrão local: `123456`

## Code Patterns

### Backend (NestJS)

#### Module Structure
```typescript
// apps/api/src/modules/[feature]/
[feature].module.ts    → Define módulo + imports
[feature].controller.ts → Rotas REST + validação
[feature].service.ts   → Lógica de negócio
dto/                   → Data Transfer Objects (class-validator)
```

**Example**: `apps/api/src/modules/palpites/palpites.service.ts`
- Valida bloqueio de 15min antes do jogo usando `differenceInMinutes(jogo.dataHora, new Date())`
- Calcula pontuação baseado em `bolao.pts_*` configuráveis
- Usa `@CurrentUser()` decorator para userId

#### Authentication Flow
```typescript
// Proteção de rotas (já implementado)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
export class BoloesAdminController { ... }

// Pegar usuário atual
async create(@CurrentUser() user: any) { 
  const userId = user.id; // Injetado pelo JwtStrategy
}
```

**Guards location**: `apps/api/src/modules/auth/guards/`
- `JwtAuthGuard`: Valida token JWT
- `RolesGuard`: Checa `@Roles()` decorator

#### DTOs com Validação
```typescript
// Sempre usar class-validator
export class CreatePalpiteDto {
  @IsUUID()
  jogoId: string;
  
  @IsInt() @Min(0)
  golsCasa: number;
}
```

### Frontend (Next.js)

#### App Router Groups
```
app/(auth)/    → Layout sem sidebar (login)
app/(admin)/   → Layout admin com sidebar
app/(user)/    → Layout usuário comum
```

#### Service Layer Pattern
```typescript
// apps/web/src/services/[feature].service.ts
import api from './api'; // Axios instance com interceptor JWT

export const palpitesService = {
  criar: (dto: CriarPalpiteDto) => api.post('/palpites', dto),
  // Retorna tipos do packages/shared
};
```

#### Custom Hooks
```typescript
// apps/web/src/hooks/usePalpites.ts
export function usePalpites(bolaoId: string) {
  const [palpites, setPalpites] = useState<Palpite[]>([]);
  // Estado + service call + loading/error
}
```

### Shared Types
**Source**: `packages/shared/src/types/` exporta interfaces/DTOs compartilhados
```typescript
import { CriarPalpiteDto, Palpite } from 'shared';
```

## Business Rules (Critical)

### Bloqueio de Palpites
**Regra**: Palpites bloqueiam **15 minutos antes** do `jogo.dataHora`
**Implementação**: Backend valida em `PalpitesService.create()` e `.update()`
```typescript
if (differenceInMinutes(jogo.dataHora, new Date()) < 15) {
  throw new BadRequestException('Palpite bloqueado');
}
```

### Sistema de Pontuação
Configurável por bolão (`bolao.pts_*`):
- **10pts**: Resultado exato (golsCasa E golsFora corretos)
- **6pts**: Vencedor + gols de um time corretos
- **3pts**: Apenas vencedor correto (empate conta como vencedor)
- **2pts**: Gols de apenas um time

**Implementação**: `RankingService.calcularPontuacao()` (TODO: implementar)

### Ranking - Critérios de Desempate
1. Maior pontuação total
2. Maior número de resultados exatos
3. Maior número de vencedores corretos
4. Maior número de gols corretos
5. Ordem alfabética do nome

## Testing Strategy
**Seed data**: `npm run db:seed` cria:
- Admin: `admin@bolaoamigos.com` / `admin123`
- Usuários: `joao@email.com`, `maria@email.com`, `pedro@email.com` / `123456`
- Bolão "Brasileirão 2025" com 8 times + 2 jogos

## Common Pitfalls

### Database
- **Sempre gerar client**: Após mudanças no schema, rode `npm run db:generate`
- **Migrations vs Push**: Use `db:push` em dev, `db:migrate` em produção
- **Seed requer reset**: Se schema mudou, `db:push` apaga dados (confirmar "yes")

### Monorepo
- **Imports entre packages**: Use nome do package (`import { ... } from 'shared'`), não paths relativos
- **TypeScript paths**: Configurados em `tsconfig.json` de cada app

### Authentication
- **Token storage**: Frontend salva em `localStorage.getItem('token')`
- **Authorization header**: Axios interceptor adiciona automaticamente `Bearer <token>`
- **Guard order matters**: `@UseGuards(JwtAuthGuard, RolesGuard)` - JWT primeiro!

## Next Steps (Roadmap)
Ver `PROJECT_CONTEXT.md` para roadmap completo (5 fases). Prioridades imediatas:
1. Implementar `RankingService` com cálculo de pontuação
2. Criar `BoloesModule`, `JogosModule`, `PalpitesModule` completos
3. Frontend: páginas de palpites + ranking
4. Implementar bloqueio automático por timer/cron

## Key Files to Reference
- **Schema**: `packages/database/prisma/schema.prisma`
- **Tipos**: `packages/shared/src/types/`
- **Auth completo**: `apps/api/src/modules/auth/`
- **Seed example**: `packages/database/prisma/seed.ts`
- **Arquitetura**: `PROJECT_CONTEXT.md` (652 linhas, documentação completa)
