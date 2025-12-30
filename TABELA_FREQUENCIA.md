# Tabela de Frequência de Membros

## Visão Geral

Foi implementada uma tabela de frequência de membros na página de presença (`/presenca`). A tabela exibe visualmente a presença/ausência de cada membro em todas as sessões do período filtrado.

## Localização

- **Página**: `C:\Users\mosan\Documents\Sistemas\EsferaMesa\app\src\app\presenca\page.tsx`
- **Componente**: `C:\Users\mosan\Documents\Sistemas\EsferaMesa\app\src\components\presenca\AttendanceFrequencyTable.tsx`
- **API Endpoint**: `C:\Users\mosan\Documents\Sistemas\EsferaMesa\app\src\app\api\presenca\frequencia\route.ts`

## Estrutura da Tabela

### Colunas Fixas (Esquerda)
1. **Nome do Membro** - Nome completo do membro (sticky na esquerda para scroll horizontal)
2. **Classe** - Classe do membro (MESA, EN, CBCS, etc.)

### Colunas Dinâmicas (Centro)
- Uma coluna para cada sessão do período filtrado
- **Header**: Data da sessão no formato `dd/MM`
- **Tooltip**: Mostra tipo da sessão e data completa ao passar o mouse
- **Células**:
  - ✓ (check verde) - PRESENTE
  - ✗ (x vermelho) - FALTA ou JUSTIFICADA
  - — (traço cinza) - Sem registro (não conta no cálculo)

### Colunas Fixas (Direita)
1. **Percentual (%)** - Percentual de presenças do membro
   - Verde: ≥75%
   - Amarelo: ≥50%
   - Vermelho: <50%
2. **Total** - Formato "X/Y" onde:
   - X = Total de presenças (status PRESENTE)
   - Y = Total de sessões com registro (PRESENTE, FALTA ou JUSTIFICADA)

## Filtros

A tabela possui filtros na interface:

- **Data Início**: Filtrar sessões a partir desta data
- **Data Fim**: Filtrar sessões até esta data
- **Botão Limpar Filtros**: Remove todos os filtros aplicados

## Regras de Negócio

### Membros Exibidos
- Apenas membros com `situacao = "ATIVO"` são exibidos
- Ordenados alfabeticamente por nome

### Sessões Exibidas
- Apenas sessões do período filtrado
- Ordenadas por data (mais antigas primeiro)
- Todas as sessões do tenant atual

### Cálculos de Frequência

**Total de Presenças**:
- Conta apenas registros com `status = "PRESENTE"`

**Total de Sessões Consideradas**:
- Conta apenas sessões onde o membro tem algum registro (PRESENTE, FALTA ou JUSTIFICADA)
- Sessões sem registro não são contadas no denominador

**Percentual**:
```
Percentual = (Total de Presenças / Total de Sessões Consideradas) × 100
```

**Exemplo**:
- Membro participou de 8 sessões (tem registro)
- Foi presente em 6 delas
- Faltou em 2
- Existem outras 5 sessões onde ele não tem registro
- **Cálculo**: 6/8 = 75% (não 6/13)

## Design e UX

### Cores (Tema RER)
- **Verde (#059669)**: Presença confirmada
- **Vermelho (#DC2626)**: Falta/Justificada
- **Cinza claro**: Sem registro

### Responsividade
- **Desktop**: Tabela completa com scroll horizontal se necessário
- **Mobile**:
  - Headers fixos ao fazer scroll
  - Coluna "Nome" sticky à esquerda
  - Scroll horizontal suave

### Estados

**Loading**:
- Exibe spinner com mensagem "Carregando tabela de frequência..."

**Erro**:
- Card vermelho com mensagem de erro

**Vazio (sem membros)**:
- Mensagem: "Nenhum membro ativo encontrado."

**Vazio (sem sessões)**:
- Mensagem: "Nenhuma sessão encontrada no período selecionado."

## API Endpoint

### GET `/api/presenca/frequencia`

**Query Parameters**:
- `lojaId` (opcional) - Filtrar por loja específica
- `dataInicio` (opcional) - Data inicial (formato ISO)
- `dataFim` (opcional) - Data final (formato ISO)

**Response**:
```json
{
  "meetings": [
    {
      "id": "uuid",
      "dataSessao": "2025-01-15T00:00:00.000Z",
      "tipo": "ORDINARIA",
      "titulo": "Sessão Regular"
    }
  ],
  "members": [
    {
      "id": "uuid",
      "nomeCompleto": "João Silva",
      "class": "MESA"
    }
  ],
  "attendances": [
    {
      "memberId": "uuid",
      "meetingId": "uuid",
      "status": "PRESENTE"
    }
  ],
  "memberStats": [
    {
      "memberId": "uuid",
      "memberName": "João Silva",
      "memberClass": "MESA",
      "totalPresent": 6,
      "totalRecorded": 8,
      "percentage": 75
    }
  ]
}
```

## Arquivos Modificados/Criados

### Criados:
1. `app/src/app/api/presenca/frequencia/route.ts` - API endpoint
2. `app/src/components/presenca/AttendanceFrequencyTable.tsx` - Componente da tabela
3. `app/src/app/presenca/page-client.tsx` - Client component com filtros

### Modificados:
1. `app/src/app/presenca/page.tsx` - Agora server component que passa dados para client

## Como Usar

1. Acesse `/presenca` no navegador
2. A tabela de frequência aparece automaticamente abaixo dos cards de estatísticas
3. Use os filtros de data para ajustar o período
4. A tabela atualiza automaticamente ao mudar os filtros
5. Passe o mouse sobre as datas das colunas para ver detalhes da sessão

## Melhorias Futuras Possíveis

- Filtro por loja (dropdown)
- Exportação para Excel/CSV da tabela
- Filtro por classe de membro
- Ordenação customizada (por nome, classe, percentual)
- Destacar membros com baixa frequência (<50%)
- Gráfico de frequência por membro
- Comparação de frequência entre períodos

## Notas Técnicas

- Usa React hooks (`useState`, `useEffect`, `useMemo`)
- Client component para interatividade dos filtros
- Server component inicial para SSR dos dados
- Performance otimizada com Map para lookup de presenças
- Sticky positioning para colunas fixas
- Mobile-first design com Tailwind CSS 4
