# ⚡ Guia Rápido - Deploy no Netlify

## ✅ Checklist de Deploy

### 1️⃣ Preparação (Você já tem!)
- ✅ `netlify.toml` configurado
- ✅ `.env.example` atualizado
- ✅ `.gitignore` configurado
- ✅ Plugin Netlify adicionado ao `package.json`

### 2️⃣ Banco de Dados PostgreSQL

**Opção Recomendada: Neon (Gratuito)**

1. Acesse [neon.tech](https://neon.tech/) e crie conta
2. Crie novo projeto: `esferaordo-db`
3. Copie a **Connection String** (com pooling):
   ```
   postgresql://user:pass@host.neon.tech/db?sslmode=require
   ```
4. Guarde para usar no Netlify

### 3️⃣ Push para GitHub

```bash
# Se ainda não está no Git
git init
git add .
git commit -m "Preparar para deploy no Netlify"

# Criar repositório no GitHub e fazer push
git remote add origin https://github.com/seu-usuario/esferaordo.git
git branch -M main
git push -u origin main
```

### 4️⃣ Deploy no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com/)
2. **Add new site** > **Import from Git** > **GitHub**
3. Selecione o repositório `esferaordo`
4. Configurações (já auto-detectadas do `netlify.toml`):
   - Base directory: `.`
   - Build command: `npm run build`
   - Publish directory: `.next`

### 5️⃣ Variáveis de Ambiente (IMPORTANTE!)

No Netlify: **Site settings** > **Environment variables**

Adicione estas variáveis:

| Variável | Onde conseguir | Exemplo |
|----------|----------------|---------|
| `DATABASE_URL` | Neon.tech | `postgresql://user:pass@host.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | Gerar string aleatória | `openssl rand -base64 32` |
| `NEXT_PUBLIC_BASE_URL` | URL do Netlify | `https://seu-site.netlify.app` |

**Opcionais (Email):**
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`

### 6️⃣ Deploy!

1. Clique em **Deploy site**
2. Aguarde 3-5 minutos
3. Acesse a URL fornecida

### 7️⃣ Seed do Banco

Após o primeiro deploy, popule o banco:

```bash
# No terminal local, use a URL de produção
DATABASE_URL="url-do-neon-aqui" npm run db:seed
```

### 8️⃣ Testar

1. Acesse `https://seu-site.netlify.app/login`
2. Login com:
   - **Email**: `admin@lojamaconica.com.br`
   - **Senha**: `admin123`

## 🎉 Pronto!

Sua aplicação está no ar!

### Próximas vezes (CI/CD automático)

Basta fazer push para `main`:
```bash
git add .
git commit -m "Sua mensagem"
git push
```

O Netlify faz deploy automático! 🚀

---

**📖 Documentação Completa**: Veja `DEPLOY_NETLIFY.md` para detalhes e solução de problemas.
