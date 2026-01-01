# Deploy Rápido - Vercel

## ✅ Arquivos Criados

1. `vercel.json` - Configuração automática para a Vercel
2. `DEPLOY_VERCEL.md` - Guia completo
3. Script de build atualizado no `app/package.json`

## 🚀 Passos Rápidos

### 1. Commit e Push

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push
```

### 2. Configurar Variáveis de Ambiente na Vercel

Acesse seu projeto na Vercel → **Settings** → **Environment Variables**

**OBRIGATÓRIAS:**

| Nome | Valor | Exemplo |
|------|-------|---------|
| `DATABASE_URL` | Connection string do PostgreSQL | `postgresql://user:pass@host.region.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | String aleatória segura (32+ chars) | Gere com: `openssl rand -base64 32` |

**OPCIONAIS (para email):**

| Nome | Valor |
|------|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | Seu email |
| `EMAIL_PASSWORD` | App password do Gmail |
| `EMAIL_FROM` | `EsferaORDO <seu-email@gmail.com>` |
| `NEXT_PUBLIC_BASE_URL` | `https://seu-projeto.vercel.app` |

### 3. Fazer Redeploy

- Vá em **Deployments**
- Clique nos três pontos (...) do último deploy
- **Redeploy**

## ⚠️ IMPORTANTE: Banco de Dados

Você precisa de um banco PostgreSQL em produção. Recomendações:

### Opção 1: Neon (Recomendado - Gratuito)
1. Acesse https://neon.tech
2. Crie um projeto
3. Copie a connection string "External/Direct"
4. Use como `DATABASE_URL`

### Opção 2: Supabase (Gratuito)
1. Acesse https://supabase.com
2. Crie um projeto
3. Vá em Settings → Database
4. Copie a "Connection string" (modo "Transaction" ou "Session")
5. Use como `DATABASE_URL`

### Opção 3: Vercel Postgres
1. Na Vercel, vá em **Storage** → **Create Database** → **Postgres**
2. A `DATABASE_URL` será configurada automaticamente

## 🔍 Verificar Logs de Erro

Se der erro no deploy:

1. **Deployments** → Clique no deployment com erro
2. **View Build Logs** ou **View Function Logs**
3. Procure por:
   - Erros do Prisma
   - Variáveis de ambiente faltando
   - Erros de conexão com banco

## 🐛 Problemas Comuns

### "Cannot find module '@prisma/client'"
✅ **JÁ RESOLVIDO** - O script `postinstall` gera o cliente automaticamente

### "Error: P1001 - Can't reach database server"
❌ **Verifique**: `DATABASE_URL` está correta? Banco está rodando?

### Build falha no "prisma migrate deploy"
❌ **Verifique**: Você tem migrations criadas? (`app/prisma/migrations/`)

### Erro 500 após deploy
❌ **Verifique**: Variáveis de ambiente configuradas? Migrations aplicadas?

## 📝 Checklist Final

- [ ] `vercel.json` criado
- [ ] Código commitado e pushed
- [ ] Banco de dados PostgreSQL criado
- [ ] `DATABASE_URL` configurada na Vercel
- [ ] `JWT_SECRET` configurada na Vercel
- [ ] Redeploy executado
- [ ] Testar login em: `https://seu-projeto.vercel.app/login`

## 🎯 Próximos Passos Após Deploy

1. Acesse: `https://seu-projeto.vercel.app`
2. Vá para: `/login`
3. Use as credenciais do seed (se executou seed no banco de produção)
4. Ou crie um admin com: `npm run db:create-impessa-admin` (configurando DATABASE_URL local para produção)

---

**Dúvidas?** Consulte o arquivo `DEPLOY_VERCEL.md` para detalhes completos.
