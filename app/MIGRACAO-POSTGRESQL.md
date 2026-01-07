# 🔄 Migração de Banco de Dados PostgreSQL

## ⚠️ ALERTA DE SEGURANÇA CRÍTICO

**SUAS CREDENCIAIS FORAM COMPROMETIDAS!**

Você compartilhou as seguintes credenciais em texto plano:
- ✅ Chave OpenAI
- ✅ Senha do PostgreSQL
- ✅ Token WhatsApp UltraMsg

**AÇÃO NECESSÁRIA IMEDIATAMENTE:**

1. **OpenAI:** Acesse https://platform.openai.com/api-keys
   - Revogue a chave antiga
   - Gere uma nova chave
   - Atualize no `.env`

2. **PostgreSQL:** Altere a senha do usuário `postgres`
   ```sql
   ALTER USER postgres WITH PASSWORD 'nova_senha_forte';
   ```
   - Atualize no `.env`

3. **UltraMsg:** Acesse https://ultramsg.com/
   - Regenere o token
   - Atualize no `.env`

---

## 📋 Status da Migração

- ✅ Arquivo `.env` atualizado para PostgreSQL local
- ✅ Variáveis OpenAI e WhatsApp adicionadas
- ⏳ Pendente: Migração dos dados do Neon → PostgreSQL local

---

## 🚀 Passo a Passo da Migração

### 1. Verificar PostgreSQL Local

Certifique-se que o PostgreSQL está instalado e rodando:

```bash
# Windows - Verificar serviço
Get-Service postgresql*

# Ou tentar conectar
psql -U postgres
```

### 2. Criar o Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE saldogoisc;

# Verificar
\l

# Sair
\q
```

### 3. Exportar Dados do Neon (Opcional)

Se você tem dados no Neon que precisa migrar:

```bash
# Exportar do Neon
pg_dump "postgresql://neondb_owner:npg_QYAn4HTa3jzZ@ep-shiny-block-acd7cpyr-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require" > backup_neon.sql

# Importar no PostgreSQL local
psql -U postgres -d saldogoisc < backup_neon.sql
```

### 4. Executar Migrações do Prisma

```bash
cd app

# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate

# Ou resetar banco (se começar do zero)
npm run db:reset
```

### 5. Seed (Dados Iniciais)

```bash
# Popular banco com dados de exemplo
npm run db:seed
```

### 6. Testar Conexão

```bash
# Abrir Prisma Studio
npm run db:studio
```

Acesse: http://localhost:5555

---

## 📝 Estrutura do DATABASE_URL

### Formato Geral:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```

### Sua Configuração Atual:
```
postgresql://postgres:KXIr%25TG!AU*7(7UK%3C(%25Nhzr0KT$osb@localhost:5432/saldogoisc
```

**Nota:** Caracteres especiais na senha são URL-encoded:
- `%` → `%25`
- `!` → `!` (não precisa encode)
- `<` → `%3C`
- `(` → `(` (não precisa encode)

### Se Trocar a Senha:

Use caracteres especiais com cuidado. Exemplo de senha segura SEM caracteres especiais:
```
postgresql://postgres:Min8aS3nh4F0rt3S3mC4r4ct3r3sM4lu0s@localhost:5432/saldogoisc
```

---

## 🔍 Troubleshooting

### Erro: "password authentication failed"

1. Verifique a senha do PostgreSQL:
   ```bash
   psql -U postgres
   # Se não conseguir entrar, resete a senha
   ```

2. Resetar senha (Windows):
   - Localize `pg_hba.conf`
   - Mude `md5` para `trust`
   - Reinicie o serviço PostgreSQL
   - Entre sem senha e altere:
     ```sql
     ALTER USER postgres WITH PASSWORD 'nova_senha';
     ```
   - Reverta `pg_hba.conf` para `md5`
   - Reinicie novamente

### Erro: "database does not exist"

```sql
CREATE DATABASE saldogoisc;
```

### Erro: "connection refused"

- PostgreSQL não está rodando
- Verifique porta (padrão: 5432)
- Firewall bloqueando

---

## 📊 Comparação: Neon vs PostgreSQL Local

| Aspecto | Neon Cloud | PostgreSQL Local |
|---------|------------|------------------|
| **Velocidade** | Depende da internet | Instantâneo |
| **Custo** | Pode ter limites | Grátis |
| **Backup** | Automático | Manual |
| **Acesso** | De qualquer lugar | Apenas local |
| **Produção** | ✅ Recomendado | ❌ Não recomendado |
| **Desenvolvimento** | ✅ OK | ✅✅ Melhor |

---

## 🔒 Checklist de Segurança

Antes de continuar, confirme:

- [ ] Regenerei a chave OpenAI
- [ ] Troquei a senha do PostgreSQL
- [ ] Regenerei o token UltraMsg
- [ ] `.env` está no `.gitignore`
- [ ] Nunca mais vou compartilhar credenciais

---

## 📞 Suporte

Se tiver problemas:

1. Verifique logs do PostgreSQL
2. Teste conexão com `psql`
3. Verifique permissões de usuário
4. Confirme que o banco existe

---

**Data da Migração:** 06/01/2026
**Migrado de:** Neon PostgreSQL Cloud
**Migrado para:** PostgreSQL Local (localhost:5432)
