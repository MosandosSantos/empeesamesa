# ⚡ Setup Rápido - PostgreSQL

## ✅ Senha Configurada!

A senha foi **corretamente encodada** no `.env`:

```
Senha original: KXIr%TG!AU*7(7UK<(%Nhzr0KT$osb
URL encoded:    KXIr%25TG%21AU*7%287UK%3C%28%25Nhzr0KT$osb
```

---

## 🚀 Execute Estes Comandos (Em Ordem):

### **1️⃣ Criar o Banco de Dados**

Abra um terminal e execute:

```bash
# Digite a senha quando solicitado: KXIr%TG!AU*7(7UK<(%Nhzr0KT$osb
psql -U postgres
```

Dentro do `psql`, execute:

```sql
CREATE DATABASE saldogoisc;
\l
\q
```

✅ Você deve ver `saldogoisc` na lista de bancos!

---

### **2️⃣ Executar Migrações (Criar Tabelas)**

```bash
cd app
npm run db:migrate
```

Isso vai criar todas as tabelas (Member, Loja, User, etc.)

---

### **3️⃣ Popular com Dados Iniciais**

```bash
npm run db:seed
```

Isso vai criar:
- ✅ Tenant padrão
- ✅ Usuário admin
- ✅ Loja de exemplo

---

### **4️⃣ Abrir Interface Visual (Opcional)**

```bash
npm run db:studio
```

Acesse: http://localhost:5555

Você verá todas as tabelas e dados!

---

### **5️⃣ Rodar a Aplicação**

```bash
npm run dev
```

Acesse: http://localhost:3000

**Login:**
- Email: `admin@lojamaconica.com.br`
- Senha: `admin123`

---

## 🎯 Comando Único (Windows)

Se preferir, execute tudo de uma vez:

```bash
cd app
scripts\setup-database.bat
```

Isso executa os 4 passos automaticamente!

---

## ⚠️ Se Der Erro

### Erro: "password authentication failed"

A senha pode estar incorreta. Tente resetar:

```sql
-- No psql:
ALTER USER postgres WITH PASSWORD 'nova_senha_simples';
```

Depois atualize `.env`:
```
DATABASE_URL="postgresql://postgres:nova_senha_simples@localhost:5432/saldogoisc"
```

### Erro: "database already exists"

Tudo bem! Pule para o passo 2 (migrações)

### Erro: "relation does not exist"

Execute as migrações:
```bash
npm run db:migrate
```

---

## ✅ Checklist de Verificação

Após executar tudo:

- [ ] Banco `saldogoisc` existe
- [ ] Migrações executadas sem erro
- [ ] Dados do seed inseridos
- [ ] Aplicação roda em http://localhost:3000
- [ ] Login funciona com admin/admin123

---

## 📊 Estrutura do Banco Criada

Após as migrações, você terá estas tabelas:

```
✓ tenant
✓ user
✓ member
✓ loja
✓ potencia
✓ rito
✓ categoria
✓ lancamento
✓ member_payment
✓ payment_period
✓ payment_status
✓ meeting
✓ attendance
✓ inventory_item
✓ inventory_movement
✓ payment
✓ dues_charge
✓ kpi_snapshot
```

---

## 🎉 Pronto!

Seu banco PostgreSQL está configurado e pronto para uso!

**Próximo passo:** `npm run dev` e comece a usar o sistema! 🚀
