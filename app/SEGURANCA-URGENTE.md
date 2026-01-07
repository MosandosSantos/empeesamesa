# 🚨 ALERTA DE SEGURANÇA URGENTE

## ⚠️ CREDENCIAIS COMPROMETIDAS

Você compartilhou credenciais sensíveis publicamente. **AÇÃO IMEDIATA NECESSÁRIA!**

---

## 🔴 Credenciais Expostas:

### 1. OpenAI API Key
**Status:** 🔴 COMPROMETIDA
**Chave:** `sk-proj--xdoLr16vMpj...`

**AÇÃO:**
1. Acesse: https://platform.openai.com/api-keys
2. Clique em "Revoke" na chave comprometida
3. Crie uma nova chave
4. Atualize em `.env`:
   ```bash
   OPENAI_API_KEY="sua_nova_chave_aqui"
   ```

---

### 2. PostgreSQL Password
**Status:** 🔴 COMPROMETIDA
**Senha:** `KXIr%TG!AU*7(7UK<(%Nhzr0KT$osb`

**AÇÃO:**
1. Conecte ao PostgreSQL:
   ```bash
   psql -U postgres
   ```

2. Altere a senha:
   ```sql
   ALTER USER postgres WITH PASSWORD 'SuaNovaSenhaForte123!@#';
   \q
   ```

3. Atualize em `.env`:
   ```bash
   # Lembre-se de fazer URL encoding de caracteres especiais:
   # % → %25
   # < → %3C
   # > → %3E
   # ! → %21
   # @ → %40
   # # → %23
   DATABASE_URL="postgresql://postgres:SuaNovaSenhaForte123%21%40%23@localhost:5432/saldogoisc"
   ```

---

### 3. WhatsApp UltraMsg Token
**Status:** 🔴 COMPROMETIDA
**Instance:** `instance157766`
**Token:** `wp4l2q4tq8vbxu6l`

**AÇÃO:**
1. Acesse: https://ultramsg.com/
2. Vá em "API Settings" ou "Security"
3. Regenere o token
4. Atualize em `.env`:
   ```bash
   ULTRAMSG_TOKEN="seu_novo_token_aqui"
   ```

---

## 📋 Checklist de Segurança

Execute AGORA:

- [ ] ✅ OpenAI API Key revogada e regenerada
- [ ] ✅ Senha PostgreSQL alterada
- [ ] ✅ Token WhatsApp UltraMsg regenerado
- [ ] ✅ Arquivo `.env` atualizado
- [ ] ✅ Arquivo `.env` NÃO está commitado no Git
- [ ] ✅ Verificado que `.env` está no `.gitignore`

---

## 🔒 Boas Práticas de Segurança

### NUNCA faça:
- ❌ Compartilhar credenciais em conversas/chats
- ❌ Commitar `.env` para Git/GitHub
- ❌ Colocar credenciais em código-fonte
- ❌ Enviar credenciais por email/WhatsApp
- ❌ Postar credenciais em fóruns/Stack Overflow

### SEMPRE faça:
- ✅ Use `.env` para variáveis sensíveis
- ✅ Adicione `.env` ao `.gitignore`
- ✅ Use `.env.example` como template (sem valores reais)
- ✅ Rotate credentials regularmente
- ✅ Use senhas fortes e únicas
- ✅ Ative 2FA quando disponível

---

## 🛡️ Gerando Senhas Seguras

### PostgreSQL:
```bash
# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 24 | ForEach-Object {[char]$_})
```

### JWT Secret:
```bash
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### Ou use um gerenciador de senhas:
- 1Password
- Bitwarden
- LastPass
- KeePass

---

## 📞 O que fazer se suspeitar de uso indevido?

### OpenAI:
1. Verifique uso em: https://platform.openai.com/usage
2. Se houver cobranças suspeitas, entre em contato com suporte

### PostgreSQL:
1. Verifique conexões ativas:
   ```sql
   SELECT * FROM pg_stat_activity WHERE datname = 'saldogoisc';
   ```
2. Revogue todas as sessões se necessário

### WhatsApp:
1. Verifique logs de mensagens enviadas
2. Bloqueie a instância se necessário

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Como proteger APIs](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
- [Segurança de credenciais](https://www.ncsc.gov.uk/collection/passwords)

---

## ⏰ Timeline de Ação

| Tempo | Ação |
|-------|------|
| **Agora** | Revogar OpenAI API Key |
| **5 min** | Alterar senha PostgreSQL |
| **10 min** | Regenerar token WhatsApp |
| **15 min** | Atualizar `.env` |
| **20 min** | Testar todas as conexões |

---

**Data do Incidente:** 06/01/2026
**Severidade:** 🔴 CRÍTICA
**Status:** ⏳ Aguardando ação do usuário

---

## ✅ Após Resolver

Depois de trocar todas as credenciais:

1. Teste a aplicação:
   ```bash
   npm run db:test
   npm run dev
   ```

2. Delete este arquivo (ou marque como resolvido):
   ```bash
   # Renomear para indicar que foi resolvido
   mv SEGURANCA-URGENTE.md SEGURANCA-RESOLVIDO-2026-01-06.md
   ```

3. Monitore por atividades suspeitas nas próximas 48h

---

**Lembre-se:** A segurança é um processo contínuo, não um evento único! 🔐
