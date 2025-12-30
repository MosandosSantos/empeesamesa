# Database Documentation

## Prisma ORM Setup

Este projeto usa **Prisma ORM 5** com **SQLite** para desenvolvimento e **PostgreSQL (Neon)** para produção.

## Scripts Disponíveis

### Desenvolvimento

```bash
# Executar migrations (desenvolvimento)
npm run db:migrate

# Criar nova migration (sem aplicar)
npm run db:migrate:create

# Popular banco de dados com dados iniciais
npm run db:seed

# Abrir Prisma Studio (UI visual do banco)
npm run db:studio

# Regenerar Prisma Client após mudanças no schema
npm run db:generate

# Resetar banco de dados (CUIDADO: apaga todos os dados!)
npm run db:reset
```

## Estrutura do Banco de Dados

### Modelos Principais

#### Tenant (Potência/Loja)
- Multi-tenancy: todos os dados são isolados por `tenantId`
- Campos: `id`, `name`, `createdAt`, `updatedAt`

#### User (Usuário do Sistema)
- Autenticação e controle de acesso
- Roles: ADMIN, TREASURER, SECRETARY, MEMBER
- Campos: `id`, `tenantId`, `email`, `passwordHash`, `role`

#### Member (Membro/Irmão)
- Cadastro completo de membros da loja
- Dados pessoais, documentos, endereço, saúde
- Marcos rituais (iniciação, passagem, elevação, instalação)
- Status: ATIVO, PROPOSTO, ADORMECIDO

### Enums (TypeScript)

Como SQLite não suporta enums nativos, usamos Strings no Prisma e fornecemos type safety via TypeScript em `src/types/enums.ts`:

- `UserRole`: ADMIN, TREASURER, SECRETARY, MEMBER
- `MemberStatus`: ATIVO, PROPOSTO, ADORMECIDO
- `TipoAdmissao`: INIC, FILI, READ
- `EstadoCivil`: SOLTEIRO, CASADO, DIVORCIADO, VIUVO, UNIAO_ESTAVEL
- `TipoSanguineo`: A, B, AB, O
- `FatorRh`: POSITIVO, NEGATIVO
- `Escolaridade`: OUTRO, PRIMEIRO_GRAU, SEGUNDO_GRAU, etc.
- `UnidadeFederativa`: AC, AL, AP, AM, BA, CE, etc.

## Seed Data (Dados Iniciais)

O script `seed.ts` cria:
- 1 Tenant padrão: "Loja Padrão - RER"
- 1 Usuário admin:
  - Email: `admin@lojamaçonica.com.br`
  - Senha: `admin123`
  - Role: ADMIN
- 1 Membro de exemplo: "João da Silva Santos"

## Como Usar o Prisma Client

```typescript
import prisma from "@/lib/prisma";

// Buscar todos os membros do tenant atual
const members = await prisma.member.findMany({
  where: {
    tenantId: currentTenantId,
    situacao: "ATIVO",
  },
  orderBy: {
    nomeCompleto: "asc",
  },
});

// Criar novo membro
const newMember = await prisma.member.create({
  data: {
    tenantId: currentTenantId,
    nomeCompleto: "Nome do Membro",
    cpf: "12345678901",
    // ... outros campos
  },
});

// Atualizar membro
await prisma.member.update({
  where: { id: memberId },
  data: {
    situacao: "ADORMECIDO",
  },
});

// Soft delete (atualizar status)
await prisma.member.update({
  where: { id: memberId },
  data: {
    situacao: "ADORMECIDO",
  },
});
```

## Migrations

As migrations estão em `prisma/migrations/` e são versionadas no Git.

Para criar uma nova migration:

1. Modifique `prisma/schema.prisma`
2. Execute: `npm run db:migrate`
3. Confirme as mudanças quando solicitado
4. A migration será criada e aplicada automaticamente

## Conexão com o Banco

A URL de conexão está configurada no `.env`:

```env
DATABASE_URL="file:./dev.db"
```

Para produção com PostgreSQL:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

## Prisma Studio

Para visualizar e editar dados via interface gráfica:

```bash
npm run db:studio
```

Acesse: http://localhost:5555

## Troubleshooting

### Erro: "Can't reach database server"
- Verifique se o caminho do banco está correto no `.env`
- Para SQLite: certifique-se que o diretório existe

### Erro: "Migration failed"
- Verifique se há conflitos no schema
- Use `npm run db:reset` para resetar (CUIDADO: apaga dados!)

### Erro: "Prisma Client not found"
- Execute: `npm run db:generate`

## Referências

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
