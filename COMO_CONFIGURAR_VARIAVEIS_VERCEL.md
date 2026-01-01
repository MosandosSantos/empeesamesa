# 🎯 Como Configurar Variáveis de Ambiente na Vercel

## PASSO A PASSO SIMPLES

### Passo 1: Acesse o Painel da Vercel

1. Abra o navegador e vá para: **https://vercel.com**
2. Faça login
3. Você verá a lista dos seus projetos
4. **Clique no projeto** `empeesamesa` (ou o nome que deu)

---

### Passo 2: Abra as Configurações

Na página do projeto, você verá várias abas no topo:

```
Overview | Deployments | Analytics | Logs | Settings | ...
```

1. **Clique em "Settings"** (última aba)

---

### Passo 3: Navegue até Environment Variables

No menu lateral esquerdo de Settings, você verá várias opções:

```
General
Domains
Git
Environment Variables  ← CLIQUE AQUI
Functions
...
```

1. **Clique em "Environment Variables"**

---

### Passo 4: Adicionar DATABASE_URL

Você verá uma tela com um formulário. Agora vamos adicionar a primeira variável:

#### 4.1 - Campo "Key" (Nome da Variável)
```
┌─────────────────────────────────┐
│ DATABASE_URL                    │ ← Digite exatamente isso
└─────────────────────────────────┘
```

#### 4.2 - Campo "Value" (Valor da Variável)

**VOCÊ PRECISA DA CONNECTION STRING DO SEU BANCO POSTGRESQL**

Se ainda não tem um banco, siga as instruções abaixo em "CRIAR BANCO NEON".

Se já tem, cole a connection string aqui:

```
┌─────────────────────────────────────────────────────────────────────┐
│ postgresql://user:password@host.region.neon.tech/db?sslmode=require │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.3 - Selecionar Ambientes

Você verá três checkboxes:

```
☑ Production
☑ Preview
☑ Development
```

**MARQUE TODAS AS TRÊS OPÇÕES** ✓

#### 4.4 - Salvar

Clique no botão **"Add"** ou **"Save"**

---

### Passo 5: Adicionar JWT_SECRET

Agora vamos adicionar a segunda variável. **Repita o processo:**

#### 5.1 - Campo "Key"
```
┌─────────────────────────────────┐
│ JWT_SECRET                      │ ← Digite exatamente isso
└─────────────────────────────────┘
```

#### 5.2 - Campo "Value"

**VOCÊ PRECISA GERAR UMA STRING ALEATÓRIA SEGURA**

**Opção A - Usando seu computador (Windows):**

Abra o PowerShell e execute:
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})
```

Copie o resultado e cole no campo Value.

**Opção B - Usando site gerador:**

1. Acesse: https://generate-secret.vercel.app/32
2. Copie a string gerada
3. Cole no campo Value

**Opção C - String manual (exemplo):**
```
aB3xY9kL2pQ7mN5vD8jR4fC1hT6sW0uE
```
⚠️ **NÃO USE ESTE EXEMPLO! Gere sua própria string aleatória!**

#### 5.3 - Selecionar Ambientes

```
☑ Production
☑ Preview
☑ Development
```

**MARQUE TODAS AS TRÊS** ✓

#### 5.4 - Salvar

Clique em **"Add"** ou **"Save"**

---

### Passo 6: Verificar Variáveis Adicionadas

Agora você deve ver uma lista com suas variáveis:

```
Environment Variables (2)

┌─────────────────┬──────────────────────────────────┬────────────────────────┐
│ KEY             │ VALUE                            │ ENVIRONMENTS           │
├─────────────────┼──────────────────────────────────┼────────────────────────┤
│ DATABASE_URL    │ postgresql://...                 │ Production, Preview... │
│ JWT_SECRET      │ ••••••••••••••••••••••••••••     │ Production, Preview... │
└─────────────────┴──────────────────────────────────┴────────────────────────┘
```

✅ **Se você vê isso, está CORRETO!**

---

### Passo 7: Fazer Redeploy

Agora que as variáveis estão configuradas, precisa fazer um novo deploy:

1. Clique na aba **"Deployments"** (no topo)
2. Você verá uma lista de deployments anteriores
3. Encontre o último deployment (o mais recente no topo)
4. Clique nos **três pontinhos (...)** à direita
5. Clique em **"Redeploy"**
6. Uma modal vai abrir. **DESMARQUE** a opção "Use existing Build Cache"
7. Clique em **"Redeploy"**

⏳ **Aguarde 2-3 minutos para o build completar**

---

## 🗄️ CRIAR BANCO NEON (Se Ainda Não Tem)

### Passo 1: Criar Conta no Neon

1. Acesse: **https://console.neon.tech**
2. Clique em **"Sign Up"**
3. Escolha **"Continue with GitHub"** (ou Google/Email)
4. Autorize o acesso

### Passo 2: Criar Projeto

1. Você será redirecionado para o dashboard
2. Clique em **"Create a project"** ou **"New Project"**
3. Preencha:
   - **Name**: `esferaordo` (ou qualquer nome)
   - **Region**: `US East (Ohio)` ou `AWS us-east-1`
   - **Postgres version**: `16` (deixe o padrão)
4. Clique em **"Create project"**

⏳ **Aguarde 10-30 segundos...**

### Passo 3: Copiar Connection String

Quando o projeto for criado, você verá uma tela com **"Connection Details"**:

1. Na seção **"Connection string"**, você verá um dropdown
2. Selecione **"Pooled connection"** (não "Direct connection")
3. Você verá algo assim:

```
postgresql://username:password@ep-abc-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

4. **Clique no ícone de copiar** (📋) ao lado da string
5. **Cole essa string no campo DATABASE_URL da Vercel**

✅ **Pronto! Agora você tem um banco PostgreSQL gratuito!**

---

## 🎬 RESUMO VISUAL

```
1. Vercel → Seu Projeto → Settings
2. Menu Lateral → Environment Variables
3. Adicionar DATABASE_URL:
   - Key: DATABASE_URL
   - Value: postgresql://... (do Neon)
   - Environments: Todos marcados ✓
   - Clicar em "Add"

4. Adicionar JWT_SECRET:
   - Key: JWT_SECRET
   - Value: string-aleatoria-32-chars
   - Environments: Todos marcados ✓
   - Clicar em "Add"

5. Deployments → ... → Redeploy
```

---

## ✅ CHECKLIST FINAL

- [ ] Conta criada no Neon (https://console.neon.tech)
- [ ] Projeto criado no Neon
- [ ] Connection string copiada
- [ ] Acessei Settings → Environment Variables na Vercel
- [ ] Adicionei DATABASE_URL com a connection string do Neon
- [ ] Adicionei JWT_SECRET com string aleatória
- [ ] Ambas variáveis marcadas para Production, Preview, Development
- [ ] Fiz Redeploy (sem cache)
- [ ] Aguardei build completar
- [ ] Testei em https://meu-projeto.vercel.app/login

---

## 🆘 PROBLEMAS COMUNS

### "Não vejo Environment Variables no menu"

**Solução**: Role a página para baixo no menu lateral de Settings.

### "Não consigo adicionar variável"

**Solução**: Certifique-se de preencher Key e Value, e marcar pelo menos um ambiente.

### "Build ainda falha após adicionar variáveis"

**Solução**:
1. Verifique se DATABASE_URL está correta (copie e cole novamente)
2. Certifique-se que tem `?sslmode=require` no final
3. Faça Redeploy **SEM CACHE**

### "Connection string do Neon não funciona"

**Solução**:
1. Use a versão "Pooled connection", não "Direct"
2. Certifique-se de copiar a string COMPLETA
3. Não remova o `?sslmode=require` do final

---

## 📞 PRECISA DE AJUDA?

Se ainda tiver problemas:

1. **Copie os logs completos** do deployment que falhou
2. **Tire um print** da tela de Environment Variables (mostrando as 2 variáveis)
3. **Me mostre** e eu ajudo a resolver!

---

**Última atualização: 2026-01-01**
