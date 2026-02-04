# Módulo de Autenticação - NestJS

## Visão Geral
Sistema completo de autenticação JWT com refresh tokens, registro de usuários e controle de acesso baseado em roles (ADMIN/USUARIO).

## Endpoints da API

### 🔓 Endpoints Públicos (sem autenticação)

#### POST /api/auth/login
Autentica usuário com usuário de login e senha.

**Request Body:**
```json
{
  "usuario": "usuarioLogin",
  "senha": "123456"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "uuid",
    "nome": "João Silva",
    "usuario": "usuarioLogin",
    "email": "usuario@email.com",
    "tipo": "USUARIO",
    "ativo": true
  }
}
```

**Erros:**
- `401 Unauthorized`: Credenciais inválidas ou usuário desativado

---

#### POST /api/auth/register
Cria novo usuário (tipo USUARIO por padrão).

**Request Body:**
```json
{
  "nome": "Maria Santos",
  "usuario": "maria",
  "email": "maria@email.com",
  "senha": "senha123"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "uuid",
    "nome": "Maria Santos",
    "usuario": "maria",
    "email": "maria@email.com",
    "tipo": "USUARIO",
    "ativo": true
  }
}
```

**Erros:**
- `400 Bad Request`: Usuário ou email já cadastrado
- `400 Bad Request`: Dados inválidos (validação)

---

#### POST /api/auth/refresh
Renova access token usando refresh token válido.

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "uuid",
    "nome": "João Silva",
    "email": "usuario@email.com",
    "tipo": "USUARIO",
    "ativo": true
  }
}
```

**Erros:**
- `401 Unauthorized`: Refresh token inválido ou expirado

---

### 🔒 Endpoints Protegidos (requer autenticação)

#### GET /api/auth/me
Retorna dados do usuário autenticado.

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "usuario@email.com",
  "tipo": "USUARIO",
  "ativo": true
}
```

---

#### POST /api/auth/logout
Logout do usuário (token invalidado no cliente).

**Headers:**
```
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Logout realizado com sucesso"
}
```

---

## Configuração de Tokens

### Access Token
- **Validade**: 7 dias (configurável via `JWT_EXPIRES_IN`)
- **Secret**: `JWT_SECRET`
- **Payload**: `{ sub, email, tipo, iat, exp }`
- **Uso**: Autenticação de requisições

### Refresh Token
- **Validade**: 30 dias (configurável via `JWT_REFRESH_EXPIRES_IN`)
- **Secret**: `JWT_REFRESH_SECRET` (ou usa `JWT_SECRET` se não configurado)
- **Payload**: `{ sub, email, tipo, iat, exp }`
- **Uso**: Renovar access token expirado

### Variáveis de Ambiente
```env
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_SECRET="sua-chave-refresh-aqui"
JWT_REFRESH_EXPIRES_IN="30d"
```

---

## Guards (Proteção de Rotas)

### JwtAuthGuard
Valida presença e validade do JWT no header `Authorization`.

**Uso:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('protegido')
metodo(@CurrentUser() user: any) { }
```

**Bypass com @Public():**
```typescript
@Public()
@Get('publico')
metodo() { } // Não requer autenticação
```

### RolesGuard
Verifica se usuário possui role necessário (usado com `@Roles()`).

**Uso:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(TipoUsuario.ADMIN)
@Get('admin-only')
metodo(@CurrentUser() user: any) { }
```

**IMPORTANTE**: Sempre usar `JwtAuthGuard` ANTES de `RolesGuard`.

---

## Decorators

### @CurrentUser()
Injeta dados do usuário autenticado.

```typescript
@Get('perfil')
@UseGuards(JwtAuthGuard)
async perfil(@CurrentUser() user: any) {
  // user = { id, nome, email, tipo, ativo }
  return user;
}
```

### @Public()
Marca endpoint como público (bypass JwtAuthGuard).

```typescript
@Public()
@Get('publico')
async publico() {
  return 'Acessível sem autenticação';
}
```

### @Roles(...roles)
Restringe acesso a roles específicos.

```typescript
@Roles(TipoUsuario.ADMIN)
@Get('admin')
async admin() {
  return 'Somente administradores';
}

@Roles(TipoUsuario.ADMIN, TipoUsuario.USUARIO)
@Get('qualquer-autenticado')
async qualquer() {
  return 'Qualquer usuário autenticado';
}
```

---

## Estrutura de Arquivos

```
auth/
├── auth.controller.ts        → Endpoints REST
├── auth.service.ts           → Lógica de negócio (login, register, refresh)
├── auth.module.ts            → Configuração do módulo
│
├── decorators/
│   ├── current-user.decorator.ts  → @CurrentUser()
│   ├── public.decorator.ts        → @Public()
│   └── roles.decorator.ts         → @Roles()
│
├── dto/
│   └── login.dto.ts               → DTOs (LoginDto, RefreshTokenDto, RegisterDto)
│
├── guards/
│   ├── jwt-auth.guard.ts          → Validação JWT
│   └── roles.guard.ts             → Validação de roles
│
├── strategies/
│   └── jwt.strategy.ts            → Passport JWT Strategy
│
└── README.md                      → Esta documentação
```

---

## Fluxo de Autenticação

### 1️⃣ Login/Registro
```
Cliente → POST /auth/login (usuario, senha)
        ↓
AuthService valida credenciais (bcrypt)
        ↓
Gera accessToken (7d) + refreshToken (30d)
        ↓
Retorna tokens + dados do usuário
```

### 2️⃣ Requisição Autenticada
```
Cliente → GET /jogos (Authorization: Bearer <accessToken>)
        ↓
JwtAuthGuard valida token
        ↓
JwtStrategy decodifica payload { sub, usuario, email, tipo }
        ↓
AuthService.validateUser(sub) busca usuário ativo
        ↓
@CurrentUser() injeta dados do usuário
        ↓
Controller executa lógica
```

### 3️⃣ Renovação de Token
```
Cliente → POST /auth/refresh (refreshToken)
        ↓
AuthService valida refreshToken
        ↓
Gera novos accessToken + refreshToken
        ↓
Retorna tokens + dados do usuário
```

---

## Validações

### LoginDto
- `usuario`: string, mínimo 3 caracteres, obrigatório
- `senha`: string, mínimo 6 caracteres, obrigatório

### RegisterDto
- `nome`: string, obrigatório
- `usuario`: string, mínimo 3 caracteres, obrigatório
- `email`: email válido, único, obrigatório
- `senha`: string, mínimo 6 caracteres, obrigatório

### RefreshTokenDto
- `refreshToken`: string, obrigatório

---

## Exemplos de Uso

### Frontend - Armazenar Tokens
```typescript
// Após login
const { accessToken, refreshToken, usuario } = await api.post('/auth/login', {
  usuario: 'usuarioLogin',
  senha: '123456'
});

localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
localStorage.setItem('user', JSON.stringify(usuario));
```

### Frontend - Requisição Autenticada
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

// Interceptor para adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para renovar token expirado
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('http://localhost:3001/api/auth/refresh', {
          refreshToken,
        });

        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falhou, redirecionar para login
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Backend - Proteger Endpoint
```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TipoUsuario } from '@prisma/client';

@Controller('boloes')
export class BoloesController {
  // Endpoint público
  @Get()
  async findAll() {
    return 'Lista de bolões públicos';
  }

  // Endpoint para usuários autenticados
  @Get('meus')
  @UseGuards(JwtAuthGuard)
  async meusBoloes(@CurrentUser() user: any) {
    return `Bolões do usuário ${user.id}`;
  }

  // Endpoint apenas para ADMIN
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(TipoUsuario.ADMIN)
  async adminBoloes(@CurrentUser() user: any) {
    return 'Painel administrativo de bolões';
  }
}
```

---

## Segurança

### ✅ Boas Práticas Implementadas
- Senhas hasheadas com bcrypt (salt rounds: 10)
- JWT com expiração configurável
- Refresh tokens para renovação segura
- Validação de usuário ativo em cada requisição
- Roles para controle de acesso granular
- Secrets separados para access/refresh tokens
- DTOs com validação class-validator
- Mensagens de erro genéricas ("Credenciais inválidas")

### ⚠️ Recomendações para Produção
- Usar secrets fortes e aleatórios (min 64 chars)
- Configurar HTTPS obrigatório
- Implementar rate limiting (ex: 5 tentativas de login/min)
- Adicionar logging de eventos de segurança
- Considerar blocklist de tokens revogados (Redis)
- Implementar MFA (autenticação multi-fator)
- Validar força de senha (complexidade mínima)
- Configurar CORS adequadamente
- Implementar IP whitelisting para admin

---

## Testes

### Testando no Postman/Insomnia

**1. Registrar usuário:**
```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "nome": "Teste User",
  "usuario": "testeuser",
  "email": "teste@email.com",
  "senha": "123456"
}
```

**2. Login:**
```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "usuario": "testeuser",
  "senha": "123456"
}
```

**3. Usar endpoint protegido:**
```http
GET http://localhost:3001/api/auth/me
Authorization: Bearer <accessToken copiado do login>
```

**4. Renovar token:**
```http
POST http://localhost:3001/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refreshToken copiado do login>"
}
```

---

## Troubleshooting

### ❌ "401 Unauthorized" ao acessar endpoint protegido
- Verificar se token está sendo enviado no header `Authorization: Bearer <token>`
- Verificar se token não expirou (use `/auth/refresh` para renovar)
- Verificar se `JWT_SECRET` no backend está correto
- Verificar se usuário está ativo (`ativo: true`)

### ❌ "403 Forbidden" em endpoint com @Roles
- Verificar se usuário possui role necessário
- Verificar se `RolesGuard` está após `JwtAuthGuard`
- Verificar se `@Roles()` está com enum correto (`TipoUsuario.ADMIN`)

### ❌ "Credenciais inválidas" no login
- Verificar se usuário está correto (case-sensitive)
- Verificar se senha está correta
- Verificar se usuário existe no banco (`npm run db:studio`)
- Verificar se usuário está ativo (`ativo: true`)

### ❌ "Refresh token inválido ou expirado"
- Refresh token expirou (30 dias padrão) - fazer novo login
- Secret `JWT_REFRESH_SECRET` mudou - fazer novo login
- Token corrompido/modificado - fazer novo login

---

## Próximos Passos

- [ ] Implementar rate limiting (ex: `@nestjs/throttler`)
- [ ] Adicionar logging de auditoria (Winston/Pino)
- [ ] Implementar blocklist de tokens (Redis)
- [ ] Adicionar MFA (2FA) opcional
- [ ] Implementar recuperação de senha (email)
- [ ] Adicionar verificação de email no registro
- [ ] Implementar sessões persistentes (opcional)
- [ ] Adicionar testes unitários e E2E
- [ ] Documentar com Swagger/OpenAPI
- [ ] Implementar refresh token rotation

---

## Referências
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [Passport JWT](http://www.passportjs.org/packages/passport-jwt/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [OWASP Auth Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
