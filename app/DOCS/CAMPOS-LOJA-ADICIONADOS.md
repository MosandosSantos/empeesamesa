# 📋 Novos Campos Adicionados à Tabela Loja

**Data:** 06/01/2026
**Migration:** `20260106190650_add_loja_cnpj_and_bank_fields`

---

## 🏢 Campos do Cadastro Nacional (CNPJ)

Baseados no documento "Comprovante de Inscrição e de Situação Cadastral" da Receita Federal:

### 1. **nomeFantasia** (opcional)
- **Descrição:** Título do estabelecimento / Nome fantasia
- **Exemplo:** "ARLSFBU4"
- **Tipo:** Texto

### 2. **atividadeEconomicaPrincipal** (opcional)
- **Descrição:** Código e descrição da atividade econômica principal
- **Exemplo:** "85.99-6-99 - Outras atividades de ensino não especificadas anteriormente"
- **Tipo:** Texto

### 3. **atividadeEconomicaSecundaria** (opcional)
- **Descrição:** Código e descrição das atividades econômicas secundárias
- **Exemplo:** "Não informada"
- **Tipo:** Texto

### 4. **naturezaJuridica** (opcional)
- **Descrição:** Código e descrição da natureza jurídica
- **Exemplo:** "399-9 - Associação Privada"
- **Tipo:** Texto

### 5. **enteFederativoResponsavel** (opcional)
- **Descrição:** Ente Federativo Responsável (EFR)
- **Exemplo:** Geralmente vazio para associações privadas
- **Tipo:** Texto

### 6. **dataSituacaoCadastral** (opcional)
- **Descrição:** Data da situação cadastral do CNPJ
- **Exemplo:** 10/01/2025
- **Tipo:** Data (DateTime)

### 7. **motivoSituacaoCadastral** (opcional)
- **Descrição:** Motivo da situação cadastral
- **Exemplo:** Pode estar vazio se a situação for "ATIVA"
- **Tipo:** Texto

### 8. **situacaoEspecial** (opcional)
- **Descrição:** Situação especial do cadastro
- **Exemplo:** Geralmente vazio
- **Tipo:** Texto

### 9. **dataSituacaoEspecial** (opcional)
- **Descrição:** Data da situação especial
- **Exemplo:** Geralmente vazio
- **Tipo:** Data (DateTime)

---

## 💰 Dados Bancários

Para gerenciar informações de recebimento de pagamentos:

### 10. **bancoCodigo** (opcional)
- **Descrição:** Código do banco
- **Exemplo:** "001" (Banco do Brasil), "237" (Bradesco), "341" (Itaú)
- **Tipo:** Texto
- **Formato:** 3 dígitos

### 11. **bancoNome** (opcional)
- **Descrição:** Nome do banco
- **Exemplo:** "Banco do Brasil", "Bradesco", "Caixa Econômica Federal"
- **Tipo:** Texto

### 12. **bancoAgencia** (opcional)
- **Descrição:** Número da agência bancária
- **Exemplo:** "1234"
- **Tipo:** Texto
- **Observação:** Sem dígito verificador

### 13. **bancoAgenciaDigito** (opcional)
- **Descrição:** Dígito verificador da agência
- **Exemplo:** "5"
- **Tipo:** Texto
- **Observação:** Alguns bancos não usam dígito verificador na agência

### 14. **bancoConta** (opcional)
- **Descrição:** Número da conta bancária
- **Exemplo:** "12345678"
- **Tipo:** Texto
- **Observação:** Sem dígito verificador

### 15. **bancoContaDigito** (opcional)
- **Descrição:** Dígito verificador da conta
- **Exemplo:** "9"
- **Tipo:** Texto

### 16. **bancoTipoConta** (opcional)
- **Descrição:** Tipo da conta bancária
- **Valores possíveis:**
  - `CORRENTE` - Conta Corrente
  - `POUPANCA` - Conta Poupança
- **Tipo:** Texto

### 17. **bancoPix** (opcional)
- **Descrição:** Chave PIX da loja
- **Exemplos:**
  - CNPJ: "24.994.532/0001-50"
  - E-mail: "tesouraria@loja.org.br"
  - Telefone: "+5548912345678"
  - Chave aleatória: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
- **Tipo:** Texto

---

## 📊 Campos Já Existentes (Mantidos)

Os seguintes campos do documento já existiam no sistema:

- ✅ **cnpj** - CNPJ da loja (Número de Inscrição)
- ✅ **lojaMX** - Nome empresarial / Nome da Loja
- ✅ **enderecoLogradouro** - Logradouro
- ✅ **enderecoNumero** - Número
- ✅ **enderecoComplemento** - Complemento
- ✅ **enderecoBairro** - Bairro/Distrito
- ✅ **enderecoCidade** - Município
- ✅ **enderecoUf** - UF
- ✅ **enderecoCep** - CEP
- ✅ **email** - Endereço eletrônico
- ✅ **telefone** - Telefone
- ✅ **situacao** - Situação cadastral (ATIVA, ADORMECIDA, SUSPENSA, EXTINGUIDA)

---

## 🎯 Uso dos Novos Campos

### Cadastro Nacional (CNPJ)
Esses campos permitem armazenar informações completas do cadastro da Receita Federal, facilitando:
- Emissão de documentos fiscais
- Comprovação de regularidade
- Auditoria e compliance
- Relatórios gerenciais

### Dados Bancários
Essenciais para:
- Recebimento de mensalidades dos membros
- Transferências bancárias
- Pagamentos via PIX
- Conciliação bancária
- Relatórios financeiros

---

## 🔄 Próximos Passos

1. **Atualizar formulários** de criação/edição de lojas para incluir esses campos
2. **Adicionar validações** específicas (ex: formato de agência/conta, chave PIX)
3. **Criar interfaces** para visualização dos dados bancários
4. **Implementar máscara** para formatação de dados bancários
5. **Adicionar export/import** de dados do CNPJ (integração com API da Receita Federal, se necessário)

---

## 📝 Observações Importantes

- ✅ **Todos os campos são opcionais** - podem ser preenchidos gradualmente
- ✅ **Dados sensíveis** - informações bancárias devem ter acesso restrito
- ✅ **Validação futura** - considerar implementar validações específicas para dados bancários
- ✅ **Privacidade** - implementar controle de acesso adequado para campos sensíveis

---

## 🗄️ Estrutura da Migration

```sql
ALTER TABLE "loja" ADD COLUMN "atividadeEconomicaPrincipal" TEXT,
ADD COLUMN "atividadeEconomicaSecundaria" TEXT,
ADD COLUMN "bancoAgencia" TEXT,
ADD COLUMN "bancoAgenciaDigito" TEXT,
ADD COLUMN "bancoCodigo" TEXT,
ADD COLUMN "bancoConta" TEXT,
ADD COLUMN "bancoContaDigito" TEXT,
ADD COLUMN "bancoNome" TEXT,
ADD COLUMN "bancoPix" TEXT,
ADD COLUMN "bancoTipoConta" TEXT,
ADD COLUMN "dataSituacaoCadastral" TIMESTAMP(3),
ADD COLUMN "dataSituacaoEspecial" TIMESTAMP(3),
ADD COLUMN "enteFederativoResponsavel" TEXT,
ADD COLUMN "motivoSituacaoCadastral" TEXT,
ADD COLUMN "naturezaJuridica" TEXT,
ADD COLUMN "nomeFantasia" TEXT,
ADD COLUMN "situacaoEspecial" TEXT;
```

---

**Total de novos campos adicionados:** 17
**Compatibilidade:** PostgreSQL
**Impacto:** Nenhum nos dados existentes (todos os campos são opcionais)
