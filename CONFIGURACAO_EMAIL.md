# 📧 Configuração de Email - EsferaORDO

## ✅ Configuração Implementada

O sistema de email está configurado para usar **Yahoo SMTP** para enviar emails reais de convite.

---

## 🔧 Variáveis de Ambiente (.env)

As seguintes variáveis foram adicionadas ao arquivo `.env`:

```bash
# Email Configuration (SMTP)
EMAIL_HOST="smtp.mail.yahoo.com"
EMAIL_PORT="587"
EMAIL_USER="mosansantos@gmail.com"
EMAIL_PASSWORD="flyq twzj cqqs qegq"
EMAIL_FROM="EsferaORDO <mosansantos@gmail.com>"

# Base URL for invite links
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## 📦 Dependências Instaladas

```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

---

## 🚀 Como Funciona

### **Modo SMTP (Produção/Desenvolvimento com Email Real)**
Se as variáveis de ambiente estiverem configuradas:
- ✅ Emails são enviados **via Yahoo SMTP**
- ✅ Logs de sucesso aparecem no console: `✅ [Email] Enviado com sucesso para: ...`
- ❌ Em caso de erro SMTP, faz fallback para console + lança erro

### **Modo Console (Desenvolvimento sem SMTP)**
Se as variáveis **não estiverem** configuradas:
- 📝 Emails são apenas **logados no console**
- ⚠️ Não são enviados emails reais
- Útil para desenvolvimento local sem servidor SMTP

---

## 🧪 Como Testar

### **1. Testar Convite ao Criar Membro**

```bash
# Iniciar servidor
cd app
npm run dev
```

1. Acesse http://localhost:3000
2. Faça login
3. Vá em **Membros** → **Novo Membro**
4. Preencha com um **email válido** (pode ser seu próprio email)
5. Salve

### **2. Verificar Envio no Console**

Você verá no console:

**Se email foi enviado com sucesso:**
```
✅ [Email] Enviado com sucesso para: seuemail@example.com
```

**Se houve erro SMTP:**
```
❌ [Email] Erro ao enviar: ...
========================================
📧 EMAIL (FALLBACK - ERRO SMTP)
========================================
Para: seuemail@example.com
Erro: [mensagem de erro]
========================================
```

### **3. Verificar Caixa de Entrada**

- Verifique a caixa de entrada do email cadastrado
- Verifique também a pasta de **SPAM/LIXO ELETRÔNICO**
- O email virá de: **EsferaORDO <mosansantos@gmail.com>**
- Assunto: **Convite - EsferaORDO | Defina sua senha**

### **4. Testar Link de Convite**

1. Abra o email recebido
2. Clique no botão **"Criar Senha"**
3. Deve abrir: `http://localhost:3000/auth/set-password?token=...`
4. Defina uma senha (mínimo 8 caracteres)
5. Confirme
6. Sucesso → Redireciona para login

---

## 🔍 Troubleshooting

### **Problema: Email não está sendo enviado**

#### **1. Verificar Configurações SMTP**

No console, você deve ver:
```
[Email] Configurações SMTP não encontradas. Usando modo console.
```

**Solução:** Verifique se as variáveis de ambiente estão no `.env` e reinicie o servidor.

#### **2. Erro de Autenticação SMTP**

Erro comum:
```
Error: Invalid login: 535 5.7.8 Error: authentication failed
```

**Soluções:**
- ✅ Certifique-se de que a senha é uma **senha de app do Yahoo**
- ✅ **NÃO** use a senha normal da conta
- ✅ Gere uma senha de app em: https://login.yahoo.com/account/security
- ✅ Se for Gmail, gere em: https://myaccount.google.com/apppasswords

#### **3. Erro de Conexão SMTP**

Erro:
```
Error: connect ETIMEDOUT
```

**Soluções:**
- Verifique sua conexão com a internet
- Firewall/Antivírus pode estar bloqueando porta 587
- Tente mudar `EMAIL_PORT` para `465` e `secure: true`

#### **4. Email vai para SPAM**

**Isso é normal** em desenvolvimento porque:
- O domínio do remetente (gmail.com) não corresponde ao servidor de envio
- Não há configuração de SPF/DKIM

**Soluções para produção:**
- Use um domínio próprio (ex: noreply@seudominio.com)
- Configure SPF, DKIM e DMARC no DNS
- Use um serviço profissional (Resend, SendGrid, Mailgun)

---

## 🌐 Configuração para Produção

### **Opção 1: Continuar com Yahoo/Gmail**

1. **Use senha de app** (mais segura)
2. Configure domínio personalizado (opcional)
3. Ajuste `EMAIL_FROM` para seu domínio

### **Opção 2: Usar Serviço Profissional (Recomendado)**

#### **Resend** (100 emails/dia grátis)
```bash
npm install resend
```

```typescript
// src/lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions) {
  await resend.emails.send({
    from: 'EsferaORDO <onboarding@seudominio.com>',
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}
```

#### **SendGrid** (100 emails/dia grátis)
```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmail(options: EmailOptions) {
  await sgMail.send({
    to: options.to,
    from: 'noreply@seudominio.com',
    subject: options.subject,
    html: options.html,
  });
}
```

---

## 📝 Logs e Monitoramento

### **Logs de Sucesso**
```
✅ [Email] Enviado com sucesso para: usuario@example.com
```

### **Logs de Erro**
```
❌ [Email] Erro ao enviar: [mensagem de erro]
```

### **Logs Detalhados (Desenvolvimento)**
```
[Membro] Convite enviado para email@example.com: {
  userId: 'uuid',
  userCreated: true,
  inviteSent: true
}
```

---

## 🔐 Segurança

### **Nunca comitar credenciais no Git!**

Certifique-se de que `.env` está no `.gitignore`:

```bash
# .gitignore
.env
.env.local
.env.production
```

### **Rotacionar Senhas**

- ✅ Troque a senha de app periodicamente
- ✅ Use senhas de app diferentes para cada ambiente (dev/prod)
- ✅ Revogue senhas de app não utilizadas

---

## 📊 Fluxo Completo de Email

```
1. Criar Membro
   └─> API: POST /api/membros
       └─> Chama: createUserAndInvite()
           ├─> Cria usuário (status: INVITED)
           ├─> Gera token de convite (48h)
           └─> Envia email via sendEmail()
               └─> SMTP Yahoo/Gmail
                   └─> Email entregue ✅

2. Usuário recebe email
   └─> Clica "Criar Senha"
       └─> /auth/set-password?token=...

3. Usuário define senha
   └─> API: POST /api/auth/set-password
       ├─> Valida token
       ├─> Define senha (bcrypt hash)
       ├─> Marca token como usado
       └─> Status: ACTIVE ✅

4. Usuário faz login
   └─> API: POST /api/auth/login
       └─> Login bem-sucedido 🎉
```

---

## 🎯 Checklist de Configuração

- [x] nodemailer instalado
- [x] @types/nodemailer instalado
- [x] Variáveis de ambiente configuradas no `.env`
- [x] EMAIL_HOST = smtp.mail.yahoo.com
- [x] EMAIL_USER e EMAIL_PASSWORD configurados
- [x] Código atualizado em `src/lib/email.ts`
- [ ] Testar envio de email criando novo membro
- [ ] Verificar email na caixa de entrada (ou SPAM)
- [ ] Testar link de convite
- [ ] Confirmar que usuário consegue definir senha

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do console
2. Teste com `EMAIL_BACKEND = console` primeiro
3. Verifique se firewall/antivírus não está bloqueando
4. Tente usar outro servidor SMTP (Gmail em vez de Yahoo)
5. Considere usar serviço profissional (Resend/SendGrid)

---

**Email configurado e pronto para uso!** 🎉
