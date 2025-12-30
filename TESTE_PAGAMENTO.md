# 🧪 GUIA DE TESTE - Pagamento de Mensalidade

## ✅ Status do Sistema

- ✅ Migration aplicada (tabela `member_payment` criada)
- ✅ Teste direto no banco funcionou (paymentMethod gravado corretamente)
- ✅ Logs detalhados adicionados na API
- ✅ Servidor rodando em http://localhost:3000

## 📋 Passo a Passo para Testar

### 1. Acesse a página de pagamentos
```
http://localhost:3000/membros/14ab80fc-5414-4b65-be17-8c2a6ed7d191/pagamentos
```

### 2. Preencha o formulário COMPLETO

**IMPORTANTE:** Preencha TODOS os campos, especialmente:

1. **Tipo de Pagamento**: Mensalidade da Loja
2. **Mês**: Dezembro (12)
3. **Ano**: 2025
4. **Descrição**: (gerada automaticamente, mas verifique se não está vazia!)
5. **Categoria**: Mensalidades
6. **Valor**: 150.00
7. **⭐ Forma de Pagamento**: PIX (MUITO IMPORTANTE - não deixe "Selecione")
8. **Data do Pagamento**: 2025-12-15 (ou qualquer data)

### 3. Antes de clicar em "Registrar Pagamento"

Abra o **Console do Navegador** (F12) e vá na aba Console.

### 4. Clique em "Registrar Pagamento"

### 5. Verifique os logs

#### No Console do Navegador:
- Você verá o payload sendo enviado

#### No Terminal do Servidor Next.js:
Você verá logs detalhados como:
```
[Payment API] ========================================
[Payment API] Request body (raw): { ... }
[Payment API] ========================================
[Payment API] Extracted fields:
  - paymentType: MENSALIDADE_LOJA (type: string)
  - referenceMonth: 12 (type: number)
  - referenceYear: 2025 (type: number)
  - description: Mensalidade da Loja - dezembro/2025 (type: string)
  - amount: 150 (type: number)
  - paymentMethod: PIX (type: string)  <-- ESTE É O CAMPO CRÍTICO
  - paymentDate: 2025-12-15 (type: string)
  - categoriaId: 346c45e0-21ba-4901-919b-ada1c63187b3 (type: string)
```

#### Se der ERRO:
Os logs vão mostrar exatamente qual campo está faltando:
```
[Payment API] ❌ VALIDATION FAILED!
[Payment API] Field presence check: {
  paymentType: true,
  description: true,
  amount: true,
  paymentMethod: false,  <-- Este está false? É o problema!
  paymentDate: true,
  categoriaId: true
}
```

#### Se der SUCESSO:
```
[Payment API] ✅ Validation passed!
[Payment API] 🎉 SUCCESS! Payment created:
  - MemberPayment ID: ...
  - MemberPayment.paymentMethod: PIX
  - Lancamento.formaPagamento: PIX
```

### 6. Verificar no banco de dados

Execute o script de verificação:
```bash
cd app && npx tsx check-payment.ts
```

Ou consulte diretamente:
```bash
cd app && npx prisma studio
```

## 🐛 Possíveis Problemas e Soluções

### Problema 1: "Missing required fields"

**Causa**: Um campo obrigatório não está sendo enviado.

**Solução**:
1. Verifique os logs do servidor para identificar qual campo está faltando
2. Campos obrigatórios:
   - paymentType
   - description (não pode estar vazio!)
   - amount (deve ser > 0)
   - paymentMethod (não pode ser vazio!)
   - paymentDate
   - categoriaId

### Problema 2: paymentMethod vazio

**Causa**: O select de "Forma de Pagamento" está com placeholder "Selecione" mas não tem valor.

**Verificação**:
1. Abra o DevTools (F12)
2. Na aba Console, digite:
   ```javascript
   document.querySelector('#paymentMethod').value
   ```
3. Se retornar "" (vazio), é o problema!

**Solução**: Certifique-se de SELECIONAR uma opção no dropdown de Forma de Pagamento.

### Problema 3: description vazia

**Causa**: O useEffect não está gerando a descrição automaticamente.

**Verificação**:
1. Olhe o campo "Descrição" no formulário
2. Deve estar preenchido automaticamente como "Mensalidade da Loja - dezembro/2025"

**Solução**: Se estiver vazio, preencha manualmente antes de submeter.

## 📊 Verificar Resultado Final

Após o pagamento ser registrado com sucesso, execute:

```bash
cd app && npx tsx check-payment.ts
```

Você deve ver:
```
✅ Total de pagamentos: 1

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Pagamento #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Membro: Joao da Silva Santos
📋 Tipo: MENSALIDADE_LOJA
💰 Valor: R$ 150.00
📅 Data: 2025-12-15
📁 Categoria: Mensalidades
📝 Descrição: Mensalidade da Loja - dezembro/2025

🎯 VERIFICAÇÃO DE MODO DE PAGAMENTO:
   ✅ MemberPayment.paymentMethod: PIX
   ✅ Lancamento.formaPagamento: PIX
   ✅ SUCESSO! Ambos os campos estão gravados corretamente!
```

## 🎯 Resultado Esperado

✅ Pagamento registrado com sucesso
✅ paymentMethod = "PIX" gravado em MemberPayment
✅ formaPagamento = "PIX" gravado em Lancamento
✅ Histórico de pagamentos atualizado na interface
✅ Sprint 6 concluída!

---

**Se encontrar algum erro, copie os logs do servidor e do navegador para análise.**
