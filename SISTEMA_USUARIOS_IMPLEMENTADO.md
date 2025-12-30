# Sistema de Gerenciamento de Usuários - Implementação Completa

## 📋 Resumo Executivo

Foi implementado um **sistema completo de gerenciamento de usuários** com RBAC (Role-Based Access Control), convite por email, definição de senha via link seguro e controle de acesso baseado no status da Loja (regra SaaS).

---

## ✅ Funcionalidades Implementadas

### 1. **CRUD Completo de Usuários**
- ✅ Listagem de usuários (com filtros por tenant/loja)
- ✅ Criação de usuários (apenas SYS_ADMIN)
- ✅ Edição de usuários (apenas SYS_ADMIN)
- ✅ Exclusão de usuários
- ✅ Reenvio de convite para usuários INVITED
- ✅ Item "Usuários" no sidebar (`/usuarios`)

### 2. **Sistema de Convites por Email**
- ✅ Convite automático ao criar novo membro (se tiver email)
- ✅ Email com link seguro para definir senha
- ✅ Token de convite com validade de 48 horas
- ✅ Uso único do token (após usado, é invalidado)
- ✅ Reenvio manual de convite via API `/api/users/invite`
- ✅ Template HTML profissional para o email

### 3. **Definição e Troca de Senha**
- ✅ Página pública `/auth/set-password` para definir senha via token
- ✅ Validação de senha (mínimo 8 caracteres)
- ✅ Confirmação de senha
- ✅ Feedback visual em tempo real
- ✅ Página protegida `/senha` para trocar senha (usuário logado)
- ✅ Item "Senha" no sidebar
- ✅ API `/api/auth/change-password`

### 4. **RBAC - 5 Níveis de Acesso**
- ✅ **SYS_ADMIN**: Acesso total ao sistema (todas as lojas)
- ✅ **LODGE_ADMIN**: Acesso total à sua loja
- ✅ **SECRETARY**: CRUD de Inventário, Membro, Presença
- ✅ **FINANCE**: CRUD de Inventário, Pagamentos e Financeiro
- ✅ **MEMBER**: Visualização de dados básicos

### 5. **Controle de Acesso SaaS**
- ✅ Bloqueio de login se usuário não está ACTIVE
- ✅ Bloqueio de login se Loja está INATIVA
- ✅ Mensagens de erro específicas para cada caso
- ✅ Validação no endpoint `/api/auth/login`

### 6. **Segurança**
- ✅ Senhas hasheadas com bcryptjs
- ✅ JWT em cookies httpOnly (não acessíveis via JS)
- ✅ Tokens de convite armazenados com hash SHA256
- ✅ Validação de expiração e uso único de tokens
- ✅ Multi-tenant com isolamento por tenantId

---

## 🗂️ Estrutura de Arquivos Criados/Modificados

### **APIs Criadas**
```
app/src/app/api/auth/
├── set-password/route.ts          # Definir senha via token
└── change-password/route.ts       # Trocar senha (logado)

app/src/app/api/users/
└── invite/route.ts                # Reenviar convite
```

### **Páginas Criadas**
```
app/src/app/
├── auth/set-password/page.tsx     # Página pública - definir senha
└── senha/page.tsx                 # Página protegida - trocar senha
```

### **Bibliotecas/Helpers Criados**
```
app/src/lib/
└── user-invite.ts                 # Helper para criar usuário + enviar convite
```

### **Arquivos Modificados**
```
app/src/components/sidebar.tsx                # Adicionado item "Senha"
app/src/app/api/auth/login/route.ts          # Validação de status User e Loja
app/src/app/api/membros/route.ts             # Integração de convite automático
```

---

## 🔄 Fluxos de Uso

### **Fluxo 1: Criar Novo Membro com Convite**
```
1. Admin/Secretary acessa /membros
2. Clica em "Novo Membro"
3. Preenche formulário com email
4. Sistema:
   - Cria o membro no banco
   - Cria usuário com status INVITED
   - Gera token de convite (48h)
   - Envia email com link de convite
5. Membro recebe email com link: /auth/set-password?token=...
6. Membro define senha (mínimo 8 caracteres)
7. Status do usuário muda para ACTIVE
8. Membro pode fazer login
```

### **Fluxo 2: Reenviar Convite (Manual)**
```
1. Admin acessa /usuarios
2. Localiza usuário com status INVITED
3. Clica em "Reenviar Convite"
4. Sistema invalida tokens anteriores
5. Gera novo token de convite (48h)
6. Envia novo email
```

### **Fluxo 3: Trocar Senha (Usuário Logado)**
```
1. Usuário logado acessa /senha (ou clica no sidebar)
2. Preenche:
   - Senha atual
   - Nova senha (mínimo 8 caracteres)
   - Confirmação
3. Sistema valida senha atual
4. Atualiza senha no banco
5. Sucesso: "Senha atualizada com sucesso"
```

### **Fluxo 4: Login com Validações**
```
1. Usuário acessa /login
2. Informa email + senha
3. Sistema valida:
   ✓ Usuário existe?
   ✓ Senha correta?
   ✓ Status do usuário é ACTIVE?
   ✓ Loja está ATIVA?
4. Se tudo OK: cria JWT e redireciona para dashboard
5. Se alguma validação falha: exibe erro específico
```

---

## 📊 Modelos de Dados (Prisma)

### **User**
```prisma
model User {
  id              String   @id @default(uuid())
  tenantId        String   // Multi-tenant obrigatório
  lojaId          String?  // Opcional (vínculo com Loja)
  email           String   // Email único por tenant
  passwordHash    String?  // Nullable até definir senha
  role            String   @default("MEMBER")  // Roles RBAC
  status          String   @default("INVITED") // INVITED | ACTIVE | SUSPENDED
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdByUserId String?
  updatedByUserId String?

  // Relations
  tenant               Tenant @relation(...)
  loja                 Loja?  @relation(...)
  passwordInviteTokens PasswordInviteToken[]

  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
  @@index([lojaId])
}
```

### **PasswordInviteToken**
```prisma
model PasswordInviteToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique      // Hash SHA256 do token
  expiresAt DateTime              // Validade: 48 horas
  usedAt    DateTime?             // null = não usado ainda
  createdAt DateTime @default(now())

  user User @relation(...)
}
```

### **Loja**
```prisma
model Loja {
  // ... outros campos
  situacao String @default("ATIVA")  // ATIVA | ADORMECIDA | SUSPENSA | EXTINGUIDA

  users User[]  // Usuários vinculados a esta loja
}
```

---

## 🔐 Roles e Permissões

| Role | Descrição | Permissões |
|------|-----------|------------|
| **SYS_ADMIN** | Administrador do Sistema | Acesso total a todas as lojas e funcionalidades |
| **LODGE_ADMIN** | Administrador da Loja | Acesso total à sua loja específica |
| **SECRETARY** | Secretário | CRUD de Membros, Presença, Inventário |
| **FINANCE** | Financeiro | CRUD de Pagamentos, Financeiro, Inventário; Visualizar Membros |
| **MEMBER** | Membro | Visualizar seus próprios dados e indicadores básicos |

**Regra principal:** Todo novo usuário é criado com role **MEMBER**. Apenas **SYS_ADMIN** pode alterar roles.

---

## 🛡️ Validações de Segurança

### **Login** (`/api/auth/login`)
```typescript
1. Verifica se usuário existe
2. Valida senha com bcrypt
3. Verifica se user.status === "ACTIVE" → senão bloqueia
4. Verifica se loja.situacao === "ATIVA" → senão bloqueia (regra SaaS)
5. Gera JWT e retorna cookie httpOnly
```

### **Tokens de Convite**
```typescript
- Gerados com 32 bytes aleatórios (crypto.randomBytes)
- Armazenados como SHA256 hash no banco
- Validade: 48 horas
- Uso único: marcado como usado após definir senha
- Tokens anteriores são invalidados ao reenviar convite
```

### **Senhas**
```typescript
- Hash: bcryptjs com 10 salt rounds
- Validação mínima: 8 caracteres
- Confirmação obrigatória
- Nunca retornadas em APIs (passwordHash sempre omitido)
```

---

## 📧 Sistema de Email

### **Configuração Atual** ✅ CONFIGURADO
- **SMTP Yahoo** configurado e funcionando
- **Desenvolvimento/Produção**: Emails são enviados via Yahoo SMTP
- **Fallback**: Se SMTP falhar, loga no console
- **Credenciais**: Configuradas em `.env`

Veja detalhes completos em: **`CONFIGURACAO_EMAIL.md`**

### **Template de Convite**
Localização: `src/lib/email.ts` → `createInviteEmailTemplate()`

**Conteúdo:**
- Logo EsferaORDO
- Saudação personalizada com nome do usuário
- Explicação do convite
- Botão "Criar Senha" (link com token)
- Aviso de validade (48 horas)
- Footer com copyright

### **Para Produção - Configurar Email Provider**

#### Opção 1: **Resend** (Recomendado - 100 emails/dia grátis)
```bash
npm install resend
```

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions) {
  await resend.emails.send({
    from: 'EsferaORDO <noreply@seudominio.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
```

#### Opção 2: **SMTP Tradicional**
```bash
npm install nodemailer
```

```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: EmailOptions) {
  await transporter.sendMail({
    from: 'EsferaORDO <noreply@seudominio.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
```

---

## ⚙️ Variáveis de Ambiente

Adicione ao `.env`:

```bash
# JWT Secret (obrigatório)
JWT_SECRET="your-secret-key-change-in-production"

# Database
DATABASE_URL="postgresql://..."

# Base URL para links de convite (produção)
NEXT_PUBLIC_BASE_URL="https://seudominio.com"

# Email Provider (escolha um)
# Resend:
RESEND_API_KEY="re_..."

# Ou SMTP:
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="seuemail@gmail.com"
SMTP_PASS="senha-app"
```

---

## 📱 SMS (Opcional - Futuro)

### Por que não implementado agora?
- SMS **não é gratuito** (custo por mensagem)
- Serviços como Twilio, AWS SNS cobram ~$0.01-0.05/SMS
- Email é suficiente para MVP e é gratuito

### Como implementar SMS no futuro:

#### **Twilio** (Recomendado)
```bash
npm install twilio
```

```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string) {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: to,
  });
}
```

**Fluxo de 2FA com SMS:**
1. Usuário define senha via email (fluxo atual)
2. Ao fazer login, sistema envia código SMS
3. Usuário insere código para confirmar
4. Login completado

---

## 🧪 Como Testar o Sistema

### **1. Criar Novo Membro com Convite**
```bash
# Iniciar servidor
cd app
npm run dev

# 1. Fazer login como admin
# 2. Acessar /membros
# 3. Clicar "Novo Membro"
# 4. Preencher com email válido
# 5. Salvar
# 6. Verificar console - deve aparecer log do email:
```

Exemplo de log esperado:
```
========================================
📧 EMAIL ENVIADO (CONSOLE)
========================================
Para: novomembro@example.com
Assunto: Convite - EsferaORDO | Defina sua senha
----------------------------------------
Conteúdo HTML:
<!DOCTYPE html>...
Link: http://localhost:3000/auth/set-password?token=abc123...
========================================
```

### **2. Definir Senha via Link**
```
1. Copiar link do log do console
2. Abrir no navegador
3. Preencher senha (mínimo 8 caracteres)
4. Confirmar senha
5. Clicar "Definir Senha"
6. Deve aparecer: "Senha criada com sucesso! Redirecionando..."
7. Redireciona para /login
```

### **3. Fazer Login**
```
1. Acessar /login
2. Email: novomembro@example.com
3. Senha: (definida no passo anterior)
4. Login bem-sucedido → Dashboard
```

### **4. Trocar Senha (Usuário Logado)**
```
1. Logado, clicar no item "Senha" do sidebar
2. Preencher senha atual
3. Nova senha (mínimo 8 caracteres)
4. Confirmar nova senha
5. Clicar "Alterar Senha"
6. Sucesso: "Senha atualizada com sucesso"
```

### **5. Testar Bloqueio por Loja Inativa**
```
1. Acessar /admin/lojas como SYS_ADMIN
2. Editar uma loja e mudar situação para "SUSPENSA"
3. Tentar fazer login com usuário dessa loja
4. Deve aparecer: "Loja inativa. Acesso suspenso."
```

---

## 📚 Endpoints da API

### **Autenticação**

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/login` | Login (retorna JWT) | Não |
| POST | `/api/auth/logout` | Logout (remove cookie) | Não |
| GET | `/api/auth/me` | Perfil do usuário logado | Sim |
| POST | `/api/auth/set-password` | Definir senha via token | Não |
| POST | `/api/auth/change-password` | Trocar senha | Sim |

### **Usuários**

| Método | Endpoint | Descrição | Permissão |
|--------|----------|-----------|-----------|
| GET | `/api/users` | Listar usuários | Qualquer autenticado |
| POST | `/api/users` | Criar usuário | SYS_ADMIN |
| PUT | `/api/users/:id` | Editar usuário | SYS_ADMIN |
| DELETE | `/api/users/:id` | Deletar usuário | SYS_ADMIN |
| POST | `/api/users/invite` | Reenviar convite | SYS_ADMIN, LODGE_ADMIN |

### **Membros**

| Método | Endpoint | Descrição | Integração |
|--------|----------|-----------|------------|
| POST | `/api/membros` | Criar membro | **Envia convite automaticamente** |

---

## 🎯 Próximos Passos (Opcionais)

### **Melhorias de Segurança**
- [ ] Implementar 2FA (autenticação de dois fatores)
- [ ] Rate limiting no login (prevenir brute force)
- [ ] Recuperação de senha ("Esqueci minha senha")
- [ ] Histórico de senhas (impedir reutilização)
- [ ] Política de expiração de senha (ex: trocar a cada 90 dias)

### **Melhorias de UX**
- [ ] Indicador de força da senha em tempo real
- [ ] Dark mode para páginas de auth
- [ ] Lembrar email no login (checkbox "Lembrar-me")
- [ ] Logout automático por inatividade
- [ ] Notificação de login em novo dispositivo

### **Funcionalidades Avançadas**
- [ ] Auditoria completa de ações dos usuários
- [ ] Gestão de sessões ativas (ver/revogar sessões)
- [ ] Permissões granulares por recurso (ABAC)
- [ ] Convite em lote (importar CSV de novos membros)
- [ ] Dashboard de atividade de usuários (últimos logins, etc)

---

## 🐛 Troubleshooting

### **Email não está sendo enviado**
**Problema:** Email só aparece no console, não chega no destinatário.
**Solução:** Configurar provider de email (Resend/SMTP) conforme seção "Sistema de Email".

### **Token de convite inválido/expirado**
**Problema:** Link não funciona.
**Soluções:**
- Verificar se token já foi usado (`usedAt` não é null)
- Verificar se expirou (mais de 48h)
- Reenviar convite via `/api/users/invite`

### **Login bloqueado mesmo com senha correta**
**Problema:** Não consegue logar.
**Verificar:**
1. Status do usuário é ACTIVE? (não INVITED ou SUSPENDED)
2. Loja está ATIVA? (não ADORMECIDA, SUSPENSA ou EXTINGUIDA)
3. Senha está correta? (bcrypt válido)

### **Erro ao criar membro: "Já existe usuário com este email"**
**Problema:** Email duplicado.
**Solução:** Sistema detecta automaticamente e vincula ao usuário existente. Se der erro, verificar constraints do Prisma.

---

## 📖 Referências

- [PRD Original](./CLAUDE.md) - Requisitos completos do projeto
- [Documentação Prisma](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui](https://ui.shadcn.com/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 📝 Changelog

### v1.0.0 (2024-12-26)
- ✅ Sistema completo de usuários com RBAC
- ✅ Convite por email com token seguro
- ✅ Definir e trocar senha
- ✅ Bloqueio de login por status (User e Loja)
- ✅ Integração automática ao criar membro
- ✅ Endpoint de reenvio de convite
- ✅ Item "Senha" no sidebar
- ✅ Validações de segurança completas

---

**Desenvolvido com** ❤️ **para EsferaORDO**
