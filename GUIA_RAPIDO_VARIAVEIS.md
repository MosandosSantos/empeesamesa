# ⚡ GUIA RÁPIDO - 5 Minutos

## 🎯 OBJETIVO

Configurar 2 variáveis de ambiente na Vercel:
1. `DATABASE_URL` (banco de dados)
2. `JWT_SECRET` (segurança)

---

## 📋 PARTE 1: CRIAR BANCO (2 minutos)

### 1. Abra este link:
👉 **https://console.neon.tech/sign_up**

### 2. Faça login com GitHub
- Clique em **"Continue with GitHub"**
- Autorize

### 3. Crie um projeto
- Clique em **"Create a project"**
- Nome: `esferaordo`
- Clique em **"Create project"**

### 4. Copie a Connection String
- Aguarde o projeto ser criado (30 segundos)
- Na tela que aparece, você verá **"Connection string"**
- No dropdown, selecione **"Pooled connection"**
- Clique no ícone de **copiar** (📋)

✅ **Você copiou algo parecido com:**
```
postgresql://username:ep************@ep-******.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 🔐 PARTE 2: GERAR JWT_SECRET (1 minuto)

### Opção A: Site Gerador (MAIS FÁCIL)

1. Abra este link: 👉 **https://generate-secret.vercel.app/32**
2. Copie a string gerada (tipo: `aB3xY9kL2pQ7mN5vD8jR4fC1hT6sW0uE`)

### Opção B: PowerShell (Windows)

```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

✅ **Você copiou uma string de ~32 caracteres**

---

## ⚙️ PARTE 3: CONFIGURAR NA VERCEL (2 minutos)

### 1. Abra seu projeto na Vercel
👉 **https://vercel.com/dashboard**

- Clique no projeto **`empeesamesa`**

### 2. Vá para Settings
- Clique na aba **"Settings"** (no topo)

### 3. Clique em Environment Variables
- No menu lateral esquerdo, clique em **"Environment Variables"**

### 4. Adicione DATABASE_URL

Preencha o formulário que aparece:

```
┌─ Add Environment Variable ─────────────────────────────┐
│                                                         │
│ Key (required)                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ DATABASE_URL                                    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Value (required)                                        │
│ ┌─────────────────────────────────────────────────┐   │
│ │ postgresql://...cole aqui a string do Neon...   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Environments                                            │
│ ☑ Production  ☑ Preview  ☑ Development                │
│                                                         │
│                              [ Cancel ]  [ Add ]        │
└─────────────────────────────────────────────────────────┘
```

- **Key**: Digite `DATABASE_URL`
- **Value**: Cole a string do Neon (que você copiou antes)
- **Marque todas as 3 caixas**: Production, Preview, Development
- Clique em **"Add"**

### 5. Adicione JWT_SECRET

Clique novamente em **"Add New"** (ou similar) e repita:

```
┌─ Add Environment Variable ─────────────────────────────┐
│                                                         │
│ Key (required)                                          │
│ ┌─────────────────────────────────────────────────┐   │
│ │ JWT_SECRET                                      │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Value (required)                                        │
│ ┌─────────────────────────────────────────────────┐   │
│ │ ...cole aqui a string aleatória que gerou...    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ Environments                                            │
│ ☑ Production  ☑ Preview  ☑ Development                │
│                                                         │
│                              [ Cancel ]  [ Add ]        │
└─────────────────────────────────────────────────────────┘
```

- **Key**: Digite `JWT_SECRET`
- **Value**: Cole a string aleatória gerada
- **Marque todas as 3 caixas**
- Clique em **"Add"**

### 6. Confirme que adicionou

Você deve ver uma lista assim:

```
Environment Variables

┌──────────────┬────────────────────────┬──────────────────┐
│ KEY          │ VALUE                  │ ENVIRONMENTS     │
├──────────────┼────────────────────────┼──────────────────┤
│ DATABASE_URL │ postgresql://...       │ Production, ...  │
│ JWT_SECRET   │ •••••••••••••••••••    │ Production, ...  │
└──────────────┴────────────────────────┴──────────────────┘
```

✅ **Se você vê 2 variáveis, está PERFEITO!**

---

## 🚀 PARTE 4: FAZER REDEPLOY (1 minuto)

### 1. Vá para Deployments
- Clique na aba **"Deployments"** (no topo da página)

### 2. Redeploy o último build
- Você verá uma lista de deployments
- No deployment mais recente (primeiro da lista), clique nos **3 pontinhos (...)**
- Clique em **"Redeploy"**

### 3. Confirme
- Uma janela vai abrir
- **DESMARQUE** "Use existing Build Cache" (se estiver marcado)
- Clique em **"Redeploy"**

### 4. Aguarde
⏳ **Aguarde 2-3 minutos para o build completar**

Você verá:
```
Building... ⏳
↓
Deploying... 🚀
↓
Ready ✅
```

---

## ✅ PRONTO!

Quando aparecer **"Ready"** ou **"Deployment Successful"**:

1. Clique no link do deployment (tipo: `https://empeesamesa-xyz.vercel.app`)
2. Adicione `/login` no final da URL
3. Teste fazer login!

---

## 📝 RESUMO DO QUE VOCÊ FEZ

1. ✅ Criou banco PostgreSQL gratuito no Neon
2. ✅ Copiou a connection string
3. ✅ Gerou uma string aleatória (JWT_SECRET)
4. ✅ Adicionou DATABASE_URL na Vercel
5. ✅ Adicionou JWT_SECRET na Vercel
6. ✅ Fez redeploy
7. ✅ Aguardou build completar

**Total: ~5 minutos** ⚡

---

## 🆘 AINDA COM PROBLEMAS?

**Se o build ainda falhar:**

1. Vá em Deployments
2. Clique no deployment que falhou
3. Role até o final dos logs
4. **Copie a mensagem de erro completa**
5. **Me envie** e eu ajudo!

**Links úteis:**

- Neon: https://console.neon.tech
- Vercel: https://vercel.com/dashboard
- Gerador de Secret: https://generate-secret.vercel.app/32
