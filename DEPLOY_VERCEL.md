# Guia de Deploy na Vercel - EsferaORDO

## Problema Identificado

O projeto Next.js está dentro da pasta `app/`, mas a Vercel tenta fazer deploy da raiz do repositório.

## Solução

### Opção 1: Usando vercel.json (Recomendado)

Já criei o arquivo `vercel.json` na raiz do projeto. Agora você precisa:

1. **Fazer commit e push do vercel.json:**
```bash
git add vercel.json DEPLOY_VERCEL.md
git commit -m "Add Vercel configuration for deployment"
git push
```

2. **Na Vercel Dashboard:**
   - Acesse seu projeto na Vercel
   - Vá em **Settings** → **General**
   - Em **Root Directory**, deixe como está (o vercel.json vai cuidar disso)
   - Role até **Build & Development Settings**
   - Certifique-se que está selecionado **Next.js** como Framework Preset

3. **Fazer Redeploy:**
   - Vá em **Deployments**
   - Clique nos três pontos (...) no último deployment
   - Clique em **Redeploy**

### Opção 2: Configurar na Vercel Dashboard (Alternativa)

Se o vercel.json não funcionar, configure manualmente:

1. **Settings** → **General** → **Root Directory**
   - Altere para: `app`

2. **Build & Development Settings:**
   - Framework Preset: `Next.js`
   - Build Command: `npm run build`
   - Output Directory: `.next` (deixe padrão)
   - Install Command: `npm install`

## Variáveis de Ambiente Necessárias

Você **DEVE** configurar as seguintes variáveis de ambiente na Vercel:

1. Acesse **Settings** → **Environment Variables**

2. Adicione as seguintes variáveis:

### Obrigatórias:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```
- Use a connection string do seu banco PostgreSQL (Neon, Supabase, etc.)
- **IMPORTANTE**: Use o modo "External" ou "Direct" connection se estiver usando Neon

```bash
JWT_SECRET="your-super-secure-random-string-min-32-chars"
```
- Gere uma string aleatória segura (mínimo 32 caracteres)
- Pode usar: `openssl rand -base64 32`

### Opcionais (para funcionalidade de email):

```bash
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="seu-email@gmail.com"
EMAIL_PASSWORD="sua-app-password"
EMAIL_FROM="EsferaORDO <seu-email@gmail.com>"
NEXT_PUBLIC_BASE_URL="https://seu-app.vercel.app"
```

## Configuração do Banco de Dados

### Se estiver usando Neon (Recomendado):

1. Acesse https://neon.tech
2. Crie um novo projeto (ou use existente)
3. Copie a **Connection String** em formato "External" ou "Pooled"
4. Cole como `DATABASE_URL` nas variáveis de ambiente da Vercel

### Executar Migrations:

A Vercel executa `npm run build`, que por sua vez executa `postinstall` (prisma generate).

**IMPORTANTE**: As migrations devem ser executadas **antes** do primeiro deploy:

```bash
# No seu banco de dados de produção, execute localmente:
cd app
DATABASE_URL="sua-connection-string-de-producao" npm run db:migrate
```

Ou configure um script de build que inclua migrations:

Adicione no `package.json` do app:
```json
"scripts": {
  "build": "prisma migrate deploy && next build"
}
```

## Problemas Comuns e Soluções

### 1. Erro: "Cannot find module '@prisma/client'"

**Solução**: O `postinstall` script já está configurado para rodar `prisma generate`
```json
"postinstall": "prisma generate"
```

### 2. Erro: "ENOENT: no such file or directory"

**Causa**: A Vercel está procurando arquivos na raiz, não em `app/`

**Solução**: Use o `vercel.json` criado ou configure Root Directory = `app`

### 3. Erro de Build do Prisma

**Solução**: Certifique-se que `prisma` está em `dependencies`, não em `devDependencies`

No `app/package.json`, `prisma` deve estar em:
```json
"dependencies": {
  "prisma": "^5.22.0"
}
```

### 4. Erro 500 após Deploy

**Causa**: Provavelmente faltam variáveis de ambiente ou migrations

**Solução**:
1. Verifique as variáveis de ambiente na Vercel
2. Execute migrations no banco de produção
3. Verifique os logs da Vercel: **Deployments** → clique no deployment → **View Function Logs**

### 5. Erro: "prisma generate" falha no build

**Solução**: Adicione em `app/package.json`:
```json
"scripts": {
  "vercel-build": "prisma generate && next build"
}
```

E configure na Vercel:
- Build Command: `npm run vercel-build`

## Checklist de Deploy

- [ ] Arquivo `vercel.json` criado na raiz (ou Root Directory configurado)
- [ ] `DATABASE_URL` configurada nas variáveis de ambiente
- [ ] `JWT_SECRET` configurada nas variáveis de ambiente
- [ ] Banco de dados criado (Neon, Supabase, etc.)
- [ ] Migrations executadas no banco de produção
- [ ] `postinstall` script presente no package.json
- [ ] Código commitado e pushed para o GitHub
- [ ] Redeploy na Vercel

## Comando Rápido para Deploy

```bash
# Na raiz do projeto
git add .
git commit -m "Configure Vercel deployment"
git push

# A Vercel vai fazer auto-deploy quando detectar o push
```

## Verificar Logs

Após o deploy, se houver erros:

1. Vá em **Deployments**
2. Clique no deployment com erro
3. Clique em **View Function Logs** ou **Build Logs**
4. Copie o erro e analise

## Contato e Suporte

Se continuar com problemas:
- Verifique a documentação da Vercel: https://vercel.com/docs
- Logs completos geralmente mostram exatamente o problema
- Verifique se o build funciona localmente: `cd app && npm run build`
