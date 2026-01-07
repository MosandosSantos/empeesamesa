# 🔧 Corrigir Senha do PostgreSQL

## ❌ Erro Atual:
```
Authentication failed against database server at `localhost`,
the provided database credentials for `postgres` are not valid.
```

## 🔍 Causa:
A senha no `.env` não está correta ou o usuário `postgres` tem outra senha.

---

## ✅ Solução Rápida (3 opções)

### **OPÇÃO 1: Descobrir e Usar a Senha Atual** (Mais Rápido)

A senha que você configurou quando instalou o PostgreSQL pode ser diferente.

**Teste estas senhas comuns:**
- `postgres` (padrão)
- `admin`
- `root`
- Senha vazia (tecle Enter)
- A senha que você forneceu: `KXIr%TG!AU*7(7UK<(%Nhzr0KT$osb`

```bash
# Tente conectar para descobrir qual senha funciona:
psql -U postgres

# Se conectou, digite:
\q
```

**Depois, atualize o `.env` com a senha correta.**

---

### **OPÇÃO 2: Resetar a Senha do PostgreSQL** (Recomendado)

#### Passo 1: Editar `pg_hba.conf`

```bash
# Localizar o arquivo (Windows)
# Caminho comum: C:\Program Files\PostgreSQL\17\data\pg_hba.conf
```

**Edite o arquivo e encontre estas linhas:**
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    all             all             127.0.0.1/32            scram-sha-256
```

**Mude `scram-sha-256` para `trust`:**
```
host    all             all             127.0.0.1/32            trust
```

#### Passo 2: Reiniciar PostgreSQL

```bash
# Windows - Serviços
# Ou pelo PowerShell como administrador:
Restart-Service postgresql*
```

#### Passo 3: Conectar SEM senha

```bash
psql -U postgres
```

#### Passo 4: Alterar a senha

```sql
ALTER USER postgres WITH PASSWORD 'nova_senha_simples';
\q
```

#### Passo 5: Reverter `pg_hba.conf`

Volte `trust` para `scram-sha-256` e reinicie PostgreSQL novamente.

#### Passo 6: Atualizar `.env`

```bash
DATABASE_URL="postgresql://postgres:nova_senha_simples@localhost:5432/saldogoisc"
```

---

### **OPÇÃO 3: Usar Senha Simples (Desenvolvimento Local)**

Como é um banco **local** (não exposto na internet), você pode usar uma senha simples:

**Recomendação:**
```
Senha: postgres123
```

**DATABASE_URL:**
```
postgresql://postgres:postgres123@localhost:5432/saldogoisc
```

⚠️ **Importante:** Isso só é seguro porque o banco é LOCAL. NUNCA use senhas simples em produção!

---

## 📝 Passo a Passo Detalhado (OPÇÃO 2)

### 1. Localizar `pg_hba.conf`

**Caminhos comuns no Windows:**
```
C:\Program Files\PostgreSQL\17\data\pg_hba.conf
C:\Program Files\PostgreSQL\16\data\pg_hba.conf
C:\PostgreSQL\17\data\pg_hba.conf
```

Ou use:
```bash
psql -U postgres -c "SHOW hba_file;"
```
(Se conseguir conectar)

### 2. Editar como Administrador

- Abra o Bloco de Notas **como Administrador**
- Abra o arquivo `pg_hba.conf`
- Procure a seção `IPv4 local connections`

**ANTES:**
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
```

**DEPOIS:**
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
```

### 3. Reiniciar PostgreSQL

**Pelo Serviços do Windows:**
1. Pressione `Win + R`
2. Digite `services.msc`
3. Procure "postgresql" na lista
4. Botão direito → Reiniciar

**Ou pelo PowerShell (Administrador):**
```powershell
Restart-Service postgresql*
```

### 4. Conectar e Alterar Senha

```bash
# Agora consegue entrar sem senha:
psql -U postgres

# Dentro do psql, altere a senha:
ALTER USER postgres WITH PASSWORD 'postgres123';

# Confirme:
\password postgres
# Digite a nova senha duas vezes

# Sair:
\q
```

### 5. Reverter Segurança

**Edite `pg_hba.conf` novamente:**

**VOLTAR:**
```
host    all             all             127.0.0.1/32            scram-sha-256
```

**Reiniciar PostgreSQL novamente**

### 6. Atualizar `.env`

Edite `app/.env`:

```bash
DATABASE_URL="postgresql://postgres:postgres123@localhost:5432/saldogoisc"
```

⚠️ **Sem caracteres especiais!** Use senha simples para evitar problemas de URL encoding.

---

## 🧪 Testar a Conexão

Depois de configurar:

```bash
cd app

# 1. Testar conexão
npm run db:test

# 2. Criar banco (se não existir)
psql -U postgres -c "CREATE DATABASE saldogoisc;"

# 3. Executar migrações
npm run db:migrate

# 4. Popular com dados
npm run db:seed

# 5. Rodar aplicação
npm run dev
```

---

## 🎯 Solução MAIS RÁPIDA (Se Tiver Pressa)

1. **Abra `app/.env`**

2. **Mude a senha para algo simples:**
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saldogoisc"
   ```

3. **Tente conectar:**
   ```bash
   psql -U postgres
   # Digite: postgres
   ```

4. **Se funcionou:**
   - Mantenha essa senha
   - Continue com `npm run db:migrate`

5. **Se NÃO funcionou:**
   - Use a OPÇÃO 2 acima (resetar senha)

---

## 📞 Troubleshooting

### Erro: "psql: command not found"

PostgreSQL não está no PATH. Use o caminho completo:

```bash
"C:\Program Files\PostgreSQL\17\bin\psql" -U postgres
```

### Erro: "could not connect to server"

PostgreSQL não está rodando. Inicie o serviço:

```bash
Start-Service postgresql*
```

### Erro: "database saldogoisc does not exist"

Crie o banco:

```bash
psql -U postgres -c "CREATE DATABASE saldogoisc;"
```

---

## ✅ Checklist Final

Após configurar:

- [ ] Consegui conectar com `psql -U postgres`
- [ ] Senha está corretamente configurada no `.env`
- [ ] Banco `saldogoisc` existe
- [ ] `npm run db:test` executa sem erros
- [ ] Aplicação roda com `npm run dev`

---

**Dica:** Para desenvolvimento local, use senha **simples** (sem caracteres especiais) para evitar problemas com URL encoding!

Exemplos bons:
- ✅ `postgres`
- ✅ `postgres123`
- ✅ `admin123`

Exemplos ruins (complexos de encodar):
- ❌ `KXIr%TG!AU*7(7UK<(%Nhzr0KT$osb`
- ❌ `P@ssw0rd!#$%`
- ❌ `Se&nh@C0mpl3x@`
