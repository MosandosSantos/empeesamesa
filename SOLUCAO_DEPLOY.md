# ✅ SOLUÇÃO DO ERRO DE DEPLOY

## Erro Identificado

```
Error: No Next.js version detected. Make sure your package.json has "next"
in either "dependencies" or "devDependencies". Also check your Root Directory
setting matches the directory of your package.json file.
```

## Causa

O projeto Next.js está dentro da pasta `app/`, mas a Vercel está procurando na raiz do repositório.

## ✅ SOLUÇÃO (Configure na Vercel Dashboard)

### Passo 1: Acesse as Configurações do Projeto

1. Vá para o seu projeto na Vercel
2. Clique em **Settings** (no topo)
3. Role até a seção **General**

### Passo 2: Configure o Root Directory

Procure por **"Root Directory"** e:

1. Clique em **Edit** (ao lado de "Root Directory")
2. Digite: `app`
3. Clique em **Save**

![Root Directory](https://vercel.com/_next/image?url=%2Fdocs-proxy%2Fstatic%2Fdocs%2Fconcepts%2Fprojects%2Froot-directory.png&w=3840&q=75)

### Passo 3: Configure Build & Development Settings

Na mesma página de Settings, role até **Build & Development Settings**:

- **Framework Preset**: `Next.js` (deve detectar automaticamente)
- **Build Command**: deixe vazio (vai usar `npm run build`)
- **Output Directory**: deixe vazio (vai usar `.next`)
- **Install Command**: deixe vazio (vai usar `npm install`)

### Passo 4: Configure Variáveis de Ambiente

Ainda em **Settings**, vá para **Environment Variables**:

Adicione estas variáveis **OBRIGATÓRIAS**:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `DATABASE_URL` | `postgresql://user:pass@host.neon.tech/db?sslmode=require` | Production, Preview, Development |
| `JWT_SECRET` | `[string aleatória de 32+ caracteres]` | Production, Preview, Development |

**Para gerar JWT_SECRET:**
```bash
openssl rand -base64 32
```

**Variáveis OPCIONAIS** (para funcionalidade de email):

| Nome | Valor | Ambiente |
|------|-------|----------|
| `EMAIL_HOST` | `smtp.gmail.com` | Production |
| `EMAIL_PORT` | `587` | Production |
| `EMAIL_USER` | `seu-email@gmail.com` | Production |
| `EMAIL_PASSWORD` | `sua-app-password` | Production |
| `EMAIL_FROM` | `EsferaORDO <seu-email@gmail.com>` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://seu-projeto.vercel.app` | Production |

### Passo 5: Fazer Redeploy

1. Vá para **Deployments** (no topo)
2. Clique nos **três pontos (...)** do último deployment
3. Clique em **Redeploy**
4. Selecione **Use existing Build Cache** (desmarcado)
5. Clique em **Redeploy**

---

## 🎯 Banco de Dados PostgreSQL

### Opção 1: Neon (Recomendado - Gratuito)

1. Acesse: https://console.neon.tech
2. Clique em **Create a project**
3. Nome do projeto: `esferaordo` (ou qualquer nome)
4. Região: `US East (Ohio)` (mais próximo da Vercel)
5. Clique em **Create project**

**Copiar Connection String:**

1. No painel do projeto, clique em **Connection Details**
2. Selecione **Pooled connection** (recomendado para serverless)
3. Copie a string completa que começa com `postgresql://`
4. Use como `DATABASE_URL` na Vercel

Exemplo:
```
postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Opção 2: Vercel Postgres (Pago - mas integrado)

1. Na Vercel, vá em **Storage** (no menu lateral)
2. Clique em **Create Database**
3. Selecione **Postgres**
4. Siga o wizard
5. A `DATABASE_URL` será configurada automaticamente

### Opção 3: Supabase (Gratuito)

1. Acesse: https://supabase.com
2. Crie um novo projeto
3. Vá em **Settings** → **Database**
4. Copie a **Connection string** (modo "Session" ou "Transaction")
5. Substitua `[YOUR-PASSWORD]` pela senha do projeto
6. Use como `DATABASE_URL` na Vercel

---

## 📋 Checklist Final

- [ ] Root Directory configurado como `app` na Vercel
- [ ] Banco PostgreSQL criado (Neon/Supabase/Vercel)
- [ ] `DATABASE_URL` configurada (com string de conexão completa)
- [ ] `JWT_SECRET` configurada (string aleatória de 32+ chars)
- [ ] Redeploy executado
- [ ] Aguardar build completar (2-3 minutos)
- [ ] Testar em: `https://seu-projeto.vercel.app/login`

---

## 🐛 Se Ainda Houver Erros

### Erro: "P1001: Can't reach database server"

**Solução**:
- Verifique se o `DATABASE_URL` está correto
- Certifique-se que tem `?sslmode=require` no final
- Teste a conexão localmente primeiro

### Erro: "Prisma migrate deploy failed"

**Solução**:
- As migrations precisam existir no banco
- Execute localmente apontando para o banco de produção:

```bash
cd app
DATABASE_URL="sua-url-de-producao" npm run db:migrate
```

### Build ainda falhando?

**Copie os logs completos do build** e compartilhe comigo!

---

## ✅ Estrutura Final Esperada

```
Vercel Dashboard
└── Seu Projeto
    ├── Settings
    │   ├── General
    │   │   └── Root Directory: app
    │   ├── Environment Variables
    │   │   ├── DATABASE_URL
    │   │   └── JWT_SECRET
    │   └── Build & Development Settings
    │       └── Framework Preset: Next.js
    └── Deployments
        └── [Deploy bem-sucedido] ✅
```
