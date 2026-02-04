# Módulo de Usuários - NestJS

## Visão Geral
Gerenciamento completo de usuários com CRUD protegido por autenticação e autorização (apenas ADMIN). Inclui ordenação alfabética, hash de senha automático e bloqueio lógico (soft delete).

## Endpoints da API

**Rota base:** `/api/admin/usuarios`  
**Autenticação:** Requerida (JWT)  
**Autorização:** ADMIN apenas

### 📋 Listar Usuários
```http
GET /api/admin/usuarios
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "nome": "João Silva",
    "email": "joao@email.com",
    "tipo": "USUARIO",
    "ativo": true,
    "createdAt": "2025-12-15T10:30:00Z"
  },
  {
    "id": "uuid",
    "nome": "Maria Santos",
    "email": "maria@email.com",
    "tipo": "ADMIN",
    "ativo": true,
    "createdAt": "2025-12-14T08:15:00Z"
  }
]
```

**Características:**
- ✅ Ordenação alfabética por nome
- ✅ Senha NUNCA é retornada
- ✅ Inclui usuários ativos e inativos

---

### 👤 Buscar Usuário por ID
```http
GET /api/admin/usuarios/:id
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "uuid",
  "nome": "João Silva",
  "email": "joao@email.com",
  "tipo": "USUARIO",
  "ativo": true,
  "createdAt": "2025-12-15T10:30:00Z",
  "updatedAt": "2025-12-15T11:45:00Z"
}
```

**Erros:**
- `404 Not Found`: Usuário não encontrado

---

### ➕ Criar Usuário
```http
POST /api/admin/usuarios
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "nome": "Pedro Costa",
  "email": "pedro@email.com",
  "senha": "senha123",
  "tipo": "USUARIO",  // Opcional: ADMIN ou USUARIO (default: USUARIO)
  "ativo": true       // Opcional (default: true)
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "nome": "Pedro Costa",
  "email": "pedro@email.com",
  "tipo": "USUARIO",
  "ativo": true,
  "createdAt": "2025-12-15T12:00:00Z"
}
```

**Validações:**
- `nome`: string, obrigatório
- `email`: email válido, obrigatório, único
- `senha`: string, mínimo 6 caracteres, obrigatório
- `tipo`: enum (ADMIN | USUARIO), opcional
- `ativo`: boolean, opcional

**Erros:**
- `409 Conflict`: Email já cadastrado
- `400 Bad Request`: Dados inválidos

---

### ✏️ Atualizar Usuário
```http
PATCH /api/admin/usuarios/:id
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "nome": "Pedro Costa Jr",
  "senha": "novaSenha123"  // Será hasheada automaticamente
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "nome": "Pedro Costa Jr",
  "email": "pedro@email.com",
  "tipo": "USUARIO",
  "ativo": true,
  "createdAt": "2025-12-15T12:00:00Z",
  "updatedAt": "2025-12-15T14:30:00Z"
}
```

**Características:**
- ✅ Todos os campos são opcionais
- ✅ Senha é hasheada automaticamente com bcrypt
- ✅ Email único é validado
- ✅ Retorna dados atualizados (sem senha)

**Erros:**
- `404 Not Found`: Usuário não encontrado
- `409 Conflict`: Email já cadastrado (se alterado)
- `400 Bad Request`: Dados inválidos

---

### 🔄 Alternar Status (Ativo/Inativo)
```http
PATCH /api/admin/usuarios/:id/toggle-active
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "id": "uuid",
  "nome": "Pedro Costa",
  "email": "pedro@email.com",
  "tipo": "USUARIO",
  "ativo": false  // Invertido
}
```

**Características:**
- ✅ Soft delete (bloqueio lógico)
- ✅ Usuário inativo não pode fazer login
- ✅ Pode ser reativado posteriormente
- ✅ **Proteção**: Impede desativar último admin ativo

**Erros:**
- `404 Not Found`: Usuário não encontrado
- `400 Bad Request`: Não é possível desativar o último administrador ativo

---

### 🗑️ Remover Usuário
```http
DELETE /api/admin/usuarios/:id
Authorization: Bearer <accessToken>
```

**Response (200):**
```json
{
  "message": "Usuário removido com sucesso"
}
```

**Características:**
- ⚠️ Hard delete (remoção permanente)
- ✅ **Proteção**: Impede remover último admin ativo
- ⚠️ Irreversível

**Erros:**
- `404 Not Found`: Usuário não encontrado
- `400 Bad Request`: Não é possível remover o último administrador ativo

---

## Estrutura de Arquivos

```
users/
├── users.controller.ts    → 6 endpoints REST (CRUD + toggle-active)
├── users.service.ts       → Lógica de negócio
├── users.module.ts        → Configuração do módulo
│
└── dto/
    ├── create-user.dto.ts → DTO de criação
    └── update-user.dto.ts → DTO de atualização (partial)
```

---

## DTOs (Data Transfer Objects)

### CreateUserDto
```typescript
{
  nome: string;          // Obrigatório
  email: string;         // Obrigatório, email válido, único
  senha: string;         // Obrigatório, mínimo 6 caracteres
  tipo?: TipoUsuario;    // Opcional: ADMIN | USUARIO (default: USUARIO)
  ativo?: boolean;       // Opcional (default: true)
}
```

### UpdateUserDto
```typescript
{
  nome?: string;         // Opcional
  email?: string;        // Opcional, email válido, único
  senha?: string;        // Opcional, mínimo 6 caracteres
  tipo?: TipoUsuario;    // Opcional: ADMIN | USUARIO
  ativo?: boolean;       // Opcional
}
```

**Todos os campos são opcionais no UpdateDto** (partial update).

---

## Regras de Negócio

### 🔐 Segurança
1. **Hash de Senha**: Todas as senhas são hasheadas com bcrypt (10 salt rounds)
2. **Senha Nunca Retornada**: Endpoints NUNCA retornam o campo `senha`
3. **Autenticação Requerida**: Todos os endpoints requerem JWT válido
4. **Autorização ADMIN**: Apenas usuários com `tipo: ADMIN` podem acessar

### 🛡️ Proteções do Sistema
1. **Último Admin**: 
   - Não pode ser removido
   - Não pode ser desativado
   - Garante sempre haver pelo menos 1 admin ativo

2. **Email Único**: 
   - Validação na criação
   - Validação na atualização (se email for alterado)

3. **Validação de Dados**: 
   - Email formato válido
   - Senha mínimo 6 caracteres
   - Tipo enum válido (ADMIN | USUARIO)

### 📊 Ordenação
- Lista de usuários é sempre ordenada alfabeticamente por `nome`
- Facilita localização visual no frontend

### 🔄 Bloqueio Lógico
- **Soft Delete**: `ativo: false` em vez de remover do banco
- Usuários inativos não podem fazer login
- Podem ser reativados com `toggle-active`
- Hard delete disponível mas protegido

---

## Métodos do Service

### Públicos (usados pelo controller)
- `create(dto)` - Cria usuário com senha hasheada
- `findAll()` - Lista todos (ordenado alfabeticamente)
- `findById(id)` - Busca por ID (sem senha)
- `findByEmail(email)` - Busca por email (com senha, uso interno)
- `update(id, dto)` - Atualiza usuário (hasheia senha se fornecida)
- `remove(id)` - Remove permanentemente (com proteção)
- `toggleActive(id)` - Alterna status ativo/inativo (com proteção)

### Métodos Auxiliares
- `findByIdWithPassword(id)` - Busca com senha (uso interno)
- `count()` - Conta total de usuários
- `countByTipo(tipo)` - Conta por tipo (ADMIN/USUARIO)
- `findAllActive()` - Lista apenas usuários ativos

---

## Exemplos de Uso

### Backend - Usar em Outros Módulos
```typescript
import { UsersService } from '../users/users.service';

@Injectable()
export class SomeService {
  constructor(private usersService: UsersService) {}

  async buscarUsuario(id: string) {
    // Busca SEM senha (seguro)
    const user = await this.usersService.findById(id);
    
    // Busca COM senha (apenas para validação interna)
    const userWithPassword = await this.usersService.findByEmail(email);
  }
}
```

### Frontend - Listar Usuários
```typescript
import { api } from '@/services/api';

const UsersPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/usuarios');
        setUsers(data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>
          <h3>{user.nome}</h3>
          <p>{user.email}</p>
          <span>{user.tipo}</span>
          <span>{user.ativo ? 'Ativo' : 'Inativo'}</span>
        </div>
      ))}
    </div>
  );
};
```

### Frontend - Criar Usuário
```typescript
const handleCreate = async (formData) => {
  try {
    const { data } = await api.post('/admin/usuarios', {
      nome: formData.nome,
      email: formData.email,
      senha: formData.senha,
      tipo: formData.tipo || 'USUARIO',
      ativo: true,
    });

    console.log('Usuário criado:', data);
    // Recarregar lista de usuários
  } catch (error) {
    if (error.response?.status === 409) {
      alert('Email já cadastrado');
    } else {
      alert('Erro ao criar usuário');
    }
  }
};
```

### Frontend - Alternar Status
```typescript
const handleToggleActive = async (userId: string) => {
  try {
    const { data } = await api.patch(`/admin/usuarios/${userId}/toggle-active`);
    console.log('Status alterado:', data.ativo);
    // Atualizar lista
  } catch (error) {
    if (error.response?.status === 400) {
      alert('Não é possível desativar o último administrador');
    }
  }
};
```

---

## Testes com Postman/Insomnia

### 1. Listar Usuários
```http
GET http://localhost:3001/api/admin/usuarios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Criar Usuário
```http
POST http://localhost:3001/api/admin/usuarios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nome": "Teste User",
  "email": "teste@email.com",
  "senha": "123456",
  "tipo": "USUARIO"
}
```

### 3. Atualizar Nome e Senha
```http
PATCH http://localhost:3001/api/admin/usuarios/<uuid>
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "nome": "Novo Nome",
  "senha": "novaSenha123"
}
```

### 4. Desativar Usuário (Soft Delete)
```http
PATCH http://localhost:3001/api/admin/usuarios/<uuid>/toggle-active
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5. Remover Usuário (Hard Delete)
```http
DELETE http://localhost:3001/api/admin/usuarios/<uuid>
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Autorização

### Diagrama de Fluxo
```
Cliente envia requisição
    ↓
JwtAuthGuard valida token JWT
    ↓
RolesGuard verifica @Roles(TipoUsuario.ADMIN)
    ↓
Se usuário.tipo === ADMIN → ✅ Permite acesso
Se usuário.tipo === USUARIO → ❌ 403 Forbidden
```

### Decorators Aplicados
```typescript
@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)  // Aplicado em TODA classe
@Roles(TipoUsuario.ADMIN)              // Requer role ADMIN
export class UsersController {
  // Todos os métodos herdam guards e roles
}
```

**IMPORTANTE**: Guards são aplicados na ordem:
1. `JwtAuthGuard` primeiro (valida token)
2. `RolesGuard` depois (valida role)

---

## Segurança - Melhores Práticas

### ✅ Implementado
- Senhas hasheadas com bcrypt (salt rounds: 10)
- Senhas NUNCA retornadas em respostas
- Autenticação JWT obrigatória
- Autorização baseada em roles (RBAC)
- Proteção contra remoção do último admin
- Validação de email único
- Validação de força de senha (mínimo 6 chars)
- Soft delete para preservar dados

### ⚠️ Recomendações Adicionais
- Implementar auditoria (log de mudanças)
- Adicionar paginação (para muitos usuários)
- Implementar filtros (nome, email, tipo, status)
- Adicionar rate limiting
- Validar força de senha (maiúsculas, números, símbolos)
- Implementar recuperação de senha
- Adicionar campo de último login
- Implementar expiração de senha (trocar a cada 90 dias)

---

## Erros Comuns

### ❌ "403 Forbidden"
**Causa**: Usuário não é ADMIN  
**Solução**: Apenas administradores podem gerenciar usuários

### ❌ "409 Conflict - Email já cadastrado"
**Causa**: Email duplicado  
**Solução**: Use outro email ou atualize o usuário existente

### ❌ "400 Bad Request - Não é possível remover/desativar último admin"
**Causa**: Tentando remover/desativar único admin ativo  
**Solução**: Crie outro admin antes ou mantenha pelo menos 1 ativo

### ❌ "404 Not Found - Usuário não encontrado"
**Causa**: ID inválido ou usuário já removido  
**Solução**: Verifique o ID e se usuário existe

### ❌ "400 Bad Request - Senha deve ter pelo menos 6 caracteres"
**Causa**: Senha muito curta  
**Solução**: Use senha com mínimo 6 caracteres

---

## Integração com Outros Módulos

### AuthModule
```typescript
// AuthService usa UsersService para validar login
await this.usersService.findByEmail(email);
await this.usersService.validateUser(userId);
```

### BoloesModule (futuro)
```typescript
// Listar usuários para adicionar em bolão
await this.usersService.findAllActive();
```

### PalpitesModule (futuro)
```typescript
// Verificar se usuário existe e está ativo
const user = await this.usersService.findById(userId);
if (!user || !user.ativo) {
  throw new UnauthorizedException('Usuário inativo');
}
```

---

## Estatísticas e Relatórios

### Endpoints Adicionais (opcional - implementar se necessário)
```typescript
// GET /api/admin/usuarios/stats
{
  "total": 50,
  "ativos": 45,
  "inativos": 5,
  "admins": 3,
  "usuarios": 47
}

// GET /api/admin/usuarios/active (já implementado)
// Lista apenas usuários ativos (ordenado alfabeticamente)
```

---

## Próximos Passos

### Backend:
- [ ] Adicionar paginação (limit/offset ou cursor-based)
- [ ] Implementar busca/filtros (nome, email, tipo, status)
- [ ] Adicionar campo `ultimoLogin`
- [ ] Implementar auditoria de mudanças
- [ ] Adicionar validação de força de senha
- [ ] Implementar recuperação de senha

### Frontend:
- [ ] Página de listagem de usuários (tabela)
- [ ] Formulário de criação/edição
- [ ] Modal de confirmação para exclusão
- [ ] Toggle switch para ativar/desativar
- [ ] Filtros e busca
- [ ] Paginação

### Testes:
- [ ] Testes unitários (service)
- [ ] Testes E2E (controller)
- [ ] Testes de integração
- [ ] Testes de segurança

---

## Referências
- [NestJS Controllers](https://docs.nestjs.com/controllers)
- [NestJS Providers](https://docs.nestjs.com/providers)
- [Class Validator](https://github.com/typestack/class-validator)
- [bcrypt.js](https://github.com/kelektiv/node.bcrypt.js)
- [Prisma Client](https://www.prisma.io/docs/concepts/components/prisma-client)
