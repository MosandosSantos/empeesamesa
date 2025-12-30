# Design System

## Princípios de Design

### Mobile-First
- Maioria dos usuários acessará pelo celular
- Interface otimizada para toque
- Componentes responsivos por padrão
- Tabelas adaptadas para mobile (cards)

### Clareza e Rapidez
- Leitura rápida de informações
- KPIs destacados
- Ações principais sempre visíveis
- Feedback imediato (toasts, loading states)

## Paleta de Cores

### Cores Rituais (RER)

**Verde** - Ações Primárias
- Uso: botões principais, links, confirmações
- Exemplo: "Salvar", "Confirmar", "Adicionar"

**Ouro** - Destaques e CTAs
- Uso: CTAs fortes, badges de destaque, rankings
- Exemplo: "+ Novo Membro", "+ Nova Sessão"

**Vermelho** - Alertas e Perigo
- Uso: exclusões, avisos, inadimplência
- Exemplo: "Excluir", alertas de vencimento

### Cores Base

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

### Tema
- **Base**: Dark elegante com alto contraste
- **Acentos**: Gradientes sutis
- **Cards**: Bordas arredondadas
- **Estado**: Cores semânticas (verde/ok, vermelho/alerta, amarelo/atenção)

## Tipografia

### Fontes
- **Sans-serif**: Geist (variável: `--font-geist-sans`)
- **Monospace**: Geist Mono (variável: `--font-geist-mono`)
- Fallback: Arial, Helvetica, sans-serif

### Hierarquia
- **H1**: 3xl, semibold - Títulos principais
- **H2**: 2xl, semibold - Seções
- **H3**: xl, medium - Subsecções
- **Body**: base/lg - Conteúdo
- **Small**: sm/xs - Labels, metadados

## Layout

### Estrutura Base (Padrão "Esfera NR6")

```
┌─────────────────────────────────────┐
│          Topbar                     │  ← Busca, ações rápidas, usuário
├────────┬────────────────────────────┤
│        │  KPI Cards                 │  ← Métricas principais
│ Side   ├────────────────────────────┤
│ bar    │  [+ Novo ...]  [Filtros]  │  ← CTA forte + controles
│        ├────────────────────────────┤
│        │  Tabela / Cards            │  ← Conteúdo principal
│        │                            │
└────────┴────────────────────────────┘
```

### Sidebar
- **Desktop**: Fixa, ícones + labels
- **Mobile**: Drawer/hambúrguer
- Itens agrupados por contexto
- Indicador de página ativa

### Topbar
- Busca global (se aplicável)
- Ações rápidas contextuais
- Menu de usuário (perfil, logout)

### KPI Cards
- 2-4 cards no topo da página
- Valor principal em destaque
- Comparativo ou contexto (ex: vs mês anterior)
- Ícone representativo

### Área de Conteúdo
- **CTA primário** em destaque ("+ Novo X")
- Filtros/busca secundários
- Tabela/lista responsiva
- Paginação quando necessário

## Componentes (shadcn/ui)

### Layout
- `AppShell`: Sidebar + Topbar + Content
- `Card`: Container genérico
- `Separator`: Divisores de seção

### Navegação
- `NavigationMenu`: Menu principal
- `Breadcrumb`: Navegação hierárquica
- `Tabs`: Abas dentro de páginas

### Data Display
- `Table`: Listagens
- `Badge`: Status, categorias
- `Avatar`: Fotos de usuário
- `Calendar`: Seleção de datas

### Forms
- `Input`: Campos de texto
- `Select`: Seleção única
- `Checkbox`: Múltipla escolha
- `Radio`: Escolha exclusiva
- `Textarea`: Texto longo
- `DatePicker`: Datas
- `Form`: Container com validação

### Feedback
- `Toast`: Notificações temporárias
- `Alert`: Avisos persistentes
- `Dialog`: Modais
- `Progress`: Indicadores de progresso
- `Skeleton`: Loading states

### Ações
- `Button`: Ações primárias/secundárias
- `DropdownMenu`: Menu de ações (ex: editar/excluir)
- `ContextMenu`: Ações por contexto
- `Command`: Palette de comandos (opcional)

## Padrões de Interface

### CRUD Padrão

**Listagem**
- Tabela com colunas claras
- Busca e filtros no topo
- Ações por linha (ícones: 👁️ visualizar, ✏️ editar, 🗑️ excluir, 🖨️ imprimir)
- CTA "+ Novo X" em destaque
- Paginação no rodapé
- Exportar CSV quando aplicável

**Formulário (Criar/Editar)**
- Campos agrupados logicamente
- Labels claros em pt-BR
- Validação inline
- Botões: "Salvar" (verde) + "Cancelar" (neutro)
- Toast de confirmação ao salvar

**Visualização**
- Layout de leitura (read-only)
- Informações organizadas em seções/tabs
- Ações secundárias (editar, imprimir, excluir)

**Exclusão**
- Sempre com confirmação (Dialog)
- Mensagem clara do que será excluído
- Botão "Excluir" em vermelho
- Soft delete preferencial

### Dashboard

**KPIs** (Cards superiores)
- Membros ativos
- % Adimplência
- Receita do mês
- Despesa do mês
- Saldo (mês + acumulado)
- Próxima sessão

**Gráficos**
- Receitas vs Despesas (últimos 6 meses) - Linha/Barras
- Adimplentes vs Inadimplentes - Donut
- Ranking (opcional) - Lista

**Filtros**
- Período (mês/trimestre/ano)
- Ações rápidas (links para módulos)

### Mobile Adaptations

**Tabelas → Cards**
```
Desktop: Tabela com múltiplas colunas
Mobile:  Cards empilhados com informações principais
         Menu de ações (três pontos)
```

**Formulários**
- Inputs full-width
- Botões stacked (um embaixo do outro)
- Date pickers mobile-friendly

**Navegação**
- Sidebar → Drawer (hambúrguer)
- Tabs → Scroll horizontal

## Estados de Componentes

### Botões
- **Primary**: Verde/Ouro (CTAs)
- **Secondary**: Cinza (ações secundárias)
- **Destructive**: Vermelho (exclusão)
- **Ghost**: Transparente (ações sutis)
- **Link**: Sem borda (navegação)

Estados: default, hover, active, disabled, loading

### Inputs
- **Default**: Borda cinza
- **Focus**: Borda verde/azul
- **Error**: Borda vermelha + mensagem
- **Disabled**: Cinza claro
- **Success**: Borda verde (após validação)

### Cards
- **Default**: Fundo branco/dark
- **Hover**: Elevação sutil (shadow)
- **Active**: Borda destacada
- **Alert**: Borda colorida (vermelho/amarelo/verde)

## Ícones

### Biblioteca
- Lucide React (padrão shadcn/ui)
- Consistência de tamanho (16px, 20px, 24px)

### Ícones Comuns
- ➕ Adicionar
- ✏️ Editar
- 🗑️ Excluir
- 👁️ Visualizar
- 🖨️ Imprimir
- 📥 Download/Exportar
- 🔍 Buscar
- 🔔 Notificações
- 👤 Usuário
- ⚙️ Configurações

## Responsividade

### Breakpoints (Tailwind)
```
sm:  640px   (smartphones grandes)
md:  768px   (tablets)
lg:  1024px  (laptops)
xl:  1280px  (desktops)
2xl: 1536px  (telas grandes)
```

### Estratégia
- **Mobile-first**: Design base para mobile
- **Progressive enhancement**: Adicionar recursos para telas maiores
- **Touch-friendly**: Áreas de toque mínimas de 44x44px

## Acessibilidade

### Contraste
- Texto: mínimo 4.5:1 (WCAG AA)
- Elementos interativos: mínimo 3:1

### Navegação
- Keyboard navigation suportada
- Focus indicators visíveis
- Skip links para conteúdo principal

### Semântica
- HTML semântico (header, nav, main, aside)
- ARIA labels quando necessário
- Alt text em imagens

## Animações

### Transições
- Duração: 150ms-300ms (rápidas e sutis)
- Easing: ease-in-out
- Uso: hover, focus, page transitions, modals

### Feedback
- Loading spinners
- Skeleton screens (carregamento)
- Toast animations (slide-in)

## Exemplos de Telas

### Dashboard
```
┌─────────────────────────────────────┐
│ 🏠 Dashboard     [Busca]  👤        │
├─────────────────────────────────────┤
│ [50 Membros] [85% Adimpl] [R$12k]  │  ← KPI Cards
├─────────────────────────────────────┤
│ 📊 Receitas vs Despesas (6 meses)  │
│ [Gráfico de linha]                 │
├─────────────────────────────────────┤
│ 🍩 Adimplência                     │
│ [Gráfico donut: 85% / 15%]         │
└─────────────────────────────────────┘
```

### Listagem de Membros
```
┌─────────────────────────────────────┐
│ 👥 Membros                          │
├─────────────────────────────────────┤
│ [+ Novo Membro]  [🔍 Buscar] [≡]   │
├─────────────────────────────────────┤
│ Nome        | Status  | Grau | ⚙️  │
│ João Silva  | Ativo   | M.I. | ... │
│ Pedro Souza | Ativo   | M.I. | ... │
│ Maria Lima  | Inativo | Apr. | ... │
└─────────────────────────────────────┘
```

### Formulário
```
┌─────────────────────────────────────┐
│ ✏️ Editar Membro                    │
├─────────────────────────────────────┤
│ Nome completo                       │
│ [___________________________]       │
│                                     │
│ E-mail                              │
│ [___________________________]       │
│                                     │
│ Status                              │
│ [▼ Ativo        ]                   │
│                                     │
│ [Cancelar]  [Salvar]               │
└─────────────────────────────────────┘
```

## Boas Práticas

1. **Consistência**: Usar componentes shadcn/ui padronizados
2. **Feedback**: Sempre dar retorno visual para ações do usuário
3. **Performance**: Lazy loading de componentes pesados
4. **Acessibilidade**: Testar com leitor de telas
5. **Mobile**: Testar em dispositivos reais (não só simuladores)
6. **Cores**: Seguir paleta RER (verde/ouro/vermelho)
7. **Textos**: Português claro e direto
