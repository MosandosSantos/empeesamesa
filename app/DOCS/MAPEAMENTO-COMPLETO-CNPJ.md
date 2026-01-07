# 📋 Mapeamento Completo: Comprovante CNPJ → Tabela Loja

**Data:** 06/01/2026
**Migration:** `20260106225343_add_cnpj_missing_fields`
**Documento de referência:** WhatsApp Image 2026-01-06 at 15.39.13.jpeg

---

## ✅ Todos os Campos do Comprovante de Inscrição CNPJ

### 🔢 **1. Número de Inscrição**
- **Valor no documento**: `24.994.532/0001-50 MATRIZ`
- **Campo no banco**: `cnpj` (String)
- **Exemplo**: "24.994.532/0001-50"
- **Tipo**: MATRIZ ou FILIAL → `tipoEstabelecimento` ✨ **NOVO**

### 🏢 **2. Nome Empresarial**
- **Valor no documento**: `LOJA MACONICA FRATERNIDADE BELEZA E UNIAO 4`
- **Campo no banco**: `lojaMX` (String)
- **Observação**: Campo obrigatório - nome oficial da loja

### 🏷️ **3. Título do Estabelecimento (Nome Fantasia)**
- **Valor no documento**: `ARLSFBU4`
- **Campo no banco**: `nomeFantasia` (String)
- **Observação**: Nome fantasia/sigla da loja

### 📅 **4. Data de Abertura**
- **Valor no documento**: `21/03/2016`
- **Campo no banco**: `dataAbertura` (DateTime) ✨ **NOVO**
- **Formato**: Data completa da abertura do estabelecimento

### 📊 **5. Porte**
- **Valor no documento**: `DEMAIS`
- **Campo no banco**: `porte` (String) ✨ **NOVO**
- **Valores possíveis**:
  - `ME` - Microempresa
  - `EPP` - Empresa de Pequeno Porte
  - `DEMAIS` - Demais portes (grandes empresas)

### 💼 **6. Atividade Econômica Principal**
- **Valor no documento**: `85.99-6-99 - Outras atividades de ensino não especificadas anteriormente`
- **Campo no banco**: `atividadeEconomicaPrincipal` (String)
- **Formato**: Código CNAE + descrição

### 💼 **7. Atividades Econômicas Secundárias**
- **Valor no documento**: `Não informada`
- **Campo no banco**: `atividadeEconomicaSecundaria` (String)
- **Observação**: Pode ter múltiplas atividades secundárias

### 🏛️ **8. Natureza Jurídica**
- **Valor no documento**: `399-9 - Associação Privada`
- **Campo no banco**: `naturezaJuridica` (String)
- **Formato**: Código + descrição

### 🏠 **9. Logradouro**
- **Valor no documento**: `R WENCESLAU EVARISTO SILVA`
- **Campo no banco**: `enderecoLogradouro` (String)

### 🔢 **10. Número**
- **Valor no documento**: `05`
- **Campo no banco**: `enderecoNumero` (String)

### 🏢 **11. Complemento**
- **Valor no documento**: `SALA 4`
- **Campo no banco**: `enderecoComplemento` (String)

### 📮 **12. CEP**
- **Valor no documento**: `88.115-200`
- **Campo no banco**: `enderecoCep` (String)
- **Formato**: 00.000-000 ou 00000000

### 🏘️ **13. Bairro/Distrito**
- **Valor no documento**: `SERRARIA`
- **Campo no banco**: `enderecoBairro` (String)

### 🌆 **14. Município**
- **Valor no documento**: `SAO JOSE`
- **Campo no banco**: `enderecoCidade` (String)

### 🗺️ **15. UF**
- **Valor no documento**: `SC`
- **Campo no banco**: `enderecoUf` (String)
- **Formato**: 2 letras (AC, AL, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)

### 📧 **16. Endereço Eletrônico**
- **Valor no documento**: `SECRETARIAFBU4@GMAIL.COM`
- **Campo no banco**: `email` (String)

### 📞 **17. Telefone**
- **Valor no documento**: `(48) 9146-1818/ (48) 9143-1713`
- **Campo no banco**: `telefone` (String)
- **Observação**: Pode conter múltiplos telefones

### 🏛️ **18. Ente Federativo Responsável (EFR)**
- **Valor no documento**: `*****` (vazio)
- **Campo no banco**: `enteFederativoResponsavel` (String)
- **Observação**: Geralmente vazio para entidades privadas

### ✅ **19. Situação Cadastral**
- **Valor no documento**: `ATIVA`
- **Campo no banco**: `situacao` (String)
- **Valores**: ATIVA, SUSPENSA, INAPTA, BAIXADA
- **Observação**: Este campo já existia mas com uso diferente (ATIVA, ADORMECIDA, SUSPENSA, EXTINGUIDA)

### 📅 **20. Data da Situação Cadastral**
- **Valor no documento**: `10/01/2025`
- **Campo no banco**: `dataSituacaoCadastral` (DateTime)

### 📝 **21. Motivo da Situação Cadastral**
- **Valor no documento**: (vazio)
- **Campo no banco**: `motivoSituacaoCadastral` (String)
- **Observação**: Preenchido quando houver suspensão/baixa

### ⚠️ **22. Situação Especial**
- **Valor no documento**: `********` (vazio)
- **Campo no banco**: `situacaoEspecial` (String)

### 📅 **23. Data da Situação Especial**
- **Valor no documento**: `********` (vazio)
- **Campo no banco**: `dataSituacaoEspecial` (DateTime)

---

## 💰 Dados Bancários (Já Existentes)

### 🏦 **Banco**
- **Campo no banco**: `bancoCodigo` (String) - Ex: "001", "237", "341"
- **Campo no banco**: `bancoNome` (String) - Ex: "Banco do Brasil", "Bradesco"

### 🏢 **Agência**
- **Campo no banco**: `bancoAgencia` (String) - Ex: "1234"
- **Campo no banco**: `bancoAgenciaDigito` (String) - Ex: "5"

### 💳 **Conta**
- **Campo no banco**: `bancoConta` (String) - Ex: "12345678"
- **Campo no banco**: `bancoContaDigito` (String) - Ex: "9"
- **Campo no banco**: `bancoTipoConta` (String) - CORRENTE ou POUPANCA

### 📱 **PIX**
- **Campo no banco**: `bancoPix` (String) - Chave PIX (CNPJ, e-mail, telefone, aleatória)

---

## ✨ Novos Campos Adicionados Nesta Atualização

| Campo | Tipo | Descrição | Exemplo |
|-------|------|-----------|---------|
| `dataAbertura` | DateTime | Data de abertura do estabelecimento | 21/03/2016 |
| `tipoEstabelecimento` | String | Matriz ou Filial | MATRIZ, FILIAL |
| `porte` | String | Porte da empresa | ME, EPP, DEMAIS |

---

## 📊 Resumo Total de Campos Relacionados ao CNPJ

| Categoria | Quantidade de Campos |
|-----------|---------------------|
| Identificação (CNPJ, nome, fantasia) | 4 |
| Classificação (abertura, porte, tipo) | 3 ✨ NOVOS |
| Atividades econômicas | 3 |
| Endereço completo | 7 |
| Contato | 2 |
| Situação cadastral | 6 |
| Dados bancários | 8 |
| **TOTAL** | **33 campos** |

---

## 🔄 Migration Aplicada

```sql
ALTER TABLE "loja"
ADD COLUMN "dataAbertura" TIMESTAMP(3),
ADD COLUMN "tipoEstabelecimento" TEXT,
ADD COLUMN "porte" TEXT;
```

---

## 🎯 Uso Recomendado

### Para Preenchimento Manual
1. Obter comprovante de inscrição da Receita Federal
2. Preencher todos os campos disponíveis no formulário de cadastro
3. Manter documento digitalizado anexo

### Para Integração Automática (Futuro)
- Integração com API da Receita Federal (ReceitaWS, etc.)
- Preenchimento automático a partir do CNPJ
- Atualização periódica dos dados cadastrais

---

## 📝 Observações Importantes

1. ✅ **Todos os 23 campos do comprovante CNPJ** estão mapeados
2. ✅ **Dados bancários completos** disponíveis (8 campos)
3. ✅ **100% compatível** com documento oficial da Receita Federal
4. ✅ **Campos opcionais** - podem ser preenchidos gradualmente
5. ⚠️ **Campo `situacao`** - atenção ao uso (tem significado diferente no sistema interno)

---

**Última atualização:** 06/01/2026 às 19:53
