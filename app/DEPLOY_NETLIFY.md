# 🚀 Deploy EsferaORDO no Netlify

Este guia fornece instruções passo a passo para fazer deploy da aplicação EsferaORDO no Netlify.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter:

1. ✅ Conta no [Netlify](https://www.netlify.com/) (gratuita)
2. ✅ Conta no [GitHub](https://github.com/) (para CI/CD automático)
3. ✅ Banco de dados PostgreSQL (recomendado: [Neon](https://neon.tech/) - tier gratuito)
4. ✅ Repositório Git do projeto

## 🗄️ Passo 1: Configurar Banco de Dados PostgreSQL

### Opção A: Neon (Recomendado - Gratuito)

1. Acesse [Neon.tech](https://neon.tech/)
2. Crie uma conta gratuita
3. Crie um novo projeto:
   - Nome: `esferaordo-db`
   - Região: `South America (São Paulo)` ou `US East (Ohio)`
4. Copie a **Connection String** (formato pooled):
   ```
   postgresql://user:password@host.neon.tech/dbname?sslmode=require
   ```
5. **Importante**: Use a string de conexão com **pooling** (pooler) para melhor performance

### Opção B: Supabase

1. Acesse [Supabase.com](https://supabase.com/)
2. Crie um projeto
3. Vá em `Settings > Database`
4. Copie a **Connection String** (modo Pooler, porta 6543)

### Opção C: Railway

1. Acesse [Railway.app](https://railway.app/)
2. Crie um novo projeto PostgreSQL
3. Copie a **Database URL**

## 🔧 Passo 2: Preparar o Repositório

### 2.1 Verificar Arquivos Necessários

Certifique-se de que os seguintes arquivos existem no projeto:

- ✅ `netlify.toml` (configuração do Netlify)
- ✅ `.env.example` (template de variáveis)
- ✅ `package.json` (dependências)
- ✅ `.gitignore` (deve incluir `.env`)

### 2.2 Verificar .gitignore

Abra `.gitignore` e certifique-se de que contém:

```gitignore
# Environment variables
.env
.env.local
.env.production.local
.env.development.local

# Dependencies
node_modules/

# Build output
.next/
out/
dist/

# Prisma
prisma/dev.db
prisma/dev.db-journal

# Testing
test-results/
playwright-report/
```

### 2.3 Fazer Push para GitHub

```bash
# Se ainda não inicializou o Git
git init
git add .
git commit -m "Preparar aplicação para deploy no Netlify"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/seu-usuario/esferaordo.git
git branch -M main
git push -u origin main
```

## 🌐 Passo 3: Configurar Deploy no Netlify

### 3.1 Importar Projeto

1. Acesse [Netlify Dashboard](https://app.netlify.com/)
2. Clique em **"Add new site"** > **"Import an existing project"**
3. Escolha **GitHub**
4. Autorize o Netlify a acessar seus repositórios
5. Selecione o repositório `esferaordo`

### 3.2 Configurar Build Settings

O Netlify deve detectar automaticamente as configurações do `netlify.toml`. Verifique:

- **Base directory**: ` ` (vazio ou `.`)
- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `.netlify/functions` (auto-detectado)

### 3.3 Configurar Variáveis de Ambiente

1. No dashboard do Netlify, vá em **Site settings** > **Environment variables**
2. Clique em **Add a variable** e adicione cada uma das seguintes:

#### Variáveis Obrigatórias:

| Variável | Exemplo de Valor | Descrição |
|----------|------------------|-----------|
| `DATABASE_URL` | `postgresql://user:pass@host.neon.tech/db?sslmode=require` | Connection string do PostgreSQL |
| `JWT_SECRET` | `gerar-string-aleatoria-32-caracteres-minimo` | Segredo para tokens JWT |
| `NEXT_PUBLIC_BASE_URL` | `https://seu-site.netlify.app` | URL base da aplicação |

#### Variáveis Opcionais (Email):

| Variável | Exemplo de Valor | Descrição |
|----------|------------------|-----------|
| `EMAIL_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `EMAIL_PORT` | `587` | Porta SMTP |
| `EMAIL_USER` | `seu-email@gmail.com` | Usuário SMTP |
| `EMAIL_PASSWORD` | `app-password-here` | Senha SMTP (use app password) |
| `EMAIL_FROM` | `EsferaORDO <noreply@example.com>` | Email remetente |

**💡 Dica**: Para gerar um JWT_SECRET seguro:
```bash
# No terminal (Linux/Mac)
openssl rand -base64 32

# Ou online: https://randomkeygen.com/
```

### 3.4 Instalar Plugin do Netlify (Automático)

O plugin `@netlify/plugin-nextjs` será instalado automaticamente quando o Netlify detectar o `netlify.toml`.

Se por algum motivo não for instalado:
1. Vá em **Site settings** > **Plugins**
2. Procure por **"Next.js Runtime"**
3. Clique em **Install**

## 🚀 Passo 4: Deploy Inicial

1. Clique em **"Deploy site"**
2. Aguarde o build (leva 2-5 minutos)
3. O Netlify vai:
   - ✅ Instalar dependências (`npm install`)
   - ✅ Gerar Prisma Client (`prisma generate`)
   - ✅ Rodar migrations (`prisma migrate deploy`)
   - ✅ Buildar Next.js (`next build`)
   - ✅ Deploy dos arquivos estáticos e funções serverless

### 4.1 Monitorar o Build

- Acompanhe o log de build em tempo real
- Se houver erros, verifique:
  - ✅ Variáveis de ambiente configuradas corretamente
  - ✅ DATABASE_URL acessível publicamente
  - ✅ Sintaxe do código está correta

## 🗃️ Passo 5: Executar Migrations e Seed

### 5.1 Executar Migrations

O comando `prisma migrate deploy` já roda automaticamente no build (veja `package.json`).

### 5.2 Seed do Banco de Dados (Primeira vez)

Para popular o banco com dados iniciais, você precisa executar o seed manualmente:

**Opção A: Via Terminal Local (Recomendado)**

```bash
# Configure DATABASE_URL no .env local com a URL de produção
DATABASE_URL="sua-url-de-producao-aqui" npm run db:seed
```

**Opção B: Via Netlify Functions (para projetos avançados)**

Você pode criar uma função serverless de seed protegida por senha.

## 🔍 Passo 6: Testar a Aplicação

1. Acesse a URL fornecida pelo Netlify (ex: `https://seu-site-random.netlify.app`)
2. Teste o login com as credenciais criadas no seed:
   - **Email**: `admin@lojamaconica.com.br`
   - **Senha**: `admin123`
3. Navegue pelas funcionalidades principais

## 🌍 Passo 7: Configurar Domínio Personalizado (Opcional)

### 7.1 Usando Domínio Netlify

1. Vá em **Site settings** > **Domain management**
2. Clique em **"Options"** > **"Edit site name"**
3. Escolha um nome: `esferaordo.netlify.app`

### 7.2 Usando Domínio Próprio

1. Vá em **Site settings** > **Domain management**
2. Clique em **"Add custom domain"**
3. Digite seu domínio (ex: `esferaordo.com.br`)
4. Configure os DNS conforme instruções do Netlify:
   - **A Record**: Aponta para IP do Netlify
   - **CNAME**: Aponta para `seu-site.netlify.app`
5. Aguarde propagação (pode levar até 48h)

### 7.3 HTTPS Automático

O Netlify fornece HTTPS gratuito via Let's Encrypt automaticamente!

## 🔄 Passo 8: CI/CD Automático

Agora toda vez que você fizer push para `main`, o Netlify:

1. ✅ Detecta o commit
2. ✅ Executa o build automaticamente
3. ✅ Faz deploy se o build for bem-sucedido
4. ✅ Reverte para versão anterior se houver erro

### Deploy Previews (Branches)

- Crie uma branch de feature: `git checkout -b feature/nova-funcionalidade`
- Faça push: `git push origin feature/nova-funcionalidade`
- O Netlify cria um **Deploy Preview** automático
- Compartilhe a URL de preview para testar antes de mergear

## 📊 Passo 9: Monitoramento

### 9.1 Logs de Função (API Routes)

1. Vá em **Functions** no dashboard
2. Clique em qualquer função para ver logs em tempo real

### 9.2 Analytics (Opcional)

1. Vá em **Site settings** > **Analytics**
2. Ative o Netlify Analytics (pago) ou integre Google Analytics

## 🐛 Solução de Problemas

### Erro: "Module not found: prisma"

**Solução**: Certifique-se de que `postinstall` está no `package.json`:
```json
"scripts": {
  "postinstall": "prisma generate"
}
```

### Erro: "Database connection failed"

**Solução**:
- ✅ Verifique se `DATABASE_URL` está configurada corretamente
- ✅ Use connection pooling (Neon: adicione `?pgbouncer=true`)
- ✅ Verifique se o IP do Netlify está liberado (Neon não requer)

### Erro: "JWT_SECRET is not defined"

**Solução**: Configure `JWT_SECRET` nas variáveis de ambiente do Netlify

### Build muito lento

**Solução**:
- ✅ Certifique-se de usar cache: Netlify faz automaticamente
- ✅ Verifique se `node_modules` está no `.gitignore`
- ✅ Use versão Node.js 20 (definido em `netlify.toml`)

### API Routes retornam 500

**Solução**:
- ✅ Verifique logs em **Functions**
- ✅ Teste localmente: `npm run dev`
- ✅ Verifique variáveis de ambiente

## 📚 Recursos Úteis

- [Documentação Netlify](https://docs.netlify.com/)
- [Next.js no Netlify](https://docs.netlify.com/frameworks/next-js/overview/)
- [Prisma + Netlify](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-netlify)
- [Neon Database](https://neon.tech/docs/introduction)

## 🎉 Conclusão

Sua aplicação EsferaORDO agora está rodando no Netlify!

### Próximos Passos:

- ✅ Configure backups automáticos do banco (Neon faz isso automaticamente)
- ✅ Configure alertas de erro (Sentry, LogRocket)
- ✅ Configure monitoramento de uptime (UptimeRobot)
- ✅ Implemente rate limiting nas API routes
- ✅ Configure domínio personalizado
- ✅ Configure email transacional (SendGrid, Mailgun)

---

**Desenvolvido com ❤️ para a comunidade RER**

Se encontrar problemas, verifique os logs no Netlify Dashboard ou consulte a documentação.
