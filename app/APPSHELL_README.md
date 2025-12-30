# AppShell - Layout Principal do Sistema EsferaORDO

## Visão Geral

O AppShell é o layout principal do sistema EsferaORDO, implementando o padrão "Esfera NR6" com sidebar fixa, topbar responsiva e área de conteúdo principal.

## Componentes Criados

### 1. Sidebar (`src/components/sidebar.tsx`)

Barra lateral de navegação com as seguintes características:

- **Layout**: Fixa à esquerda, 256px de largura
- **Conteúdo**:
  - Logo/Branding "EsferaORDO RER" no topo
  - Menu de navegação com 9 módulos principais
  - Footer com informações da versão
- **Navegação**:
  - Dashboard (/)
  - Membros (/membros)
  - Presenças (/presencas)
  - Mensalidades (/mensalidades)
  - Financeiro (/financeiro)
  - Biblioteca (/biblioteca)
  - Inventário (/inventario)
  - Quiz (/quiz)
  - Comunicação (/comunicacao)
- **Responsividade**:
  - Desktop (lg+): Sempre visível
  - Mobile (<lg): Colapsada por padrão, abre via Sheet/Drawer
- **Visual**:
  - Ícones lucide-react para cada item
  - Destaque visual para rota ativa (background primary)
  - Hover states com background accent

### 2. TopBar (`src/components/topbar.tsx`)

Barra superior com funcionalidades de navegação e ações rápidas:

- **Layout**: Sticky top, altura 64px
- **Componentes**:
  - **Botão Menu Mobile**: Visível apenas em telas < lg, abre/fecha sidebar
  - **Campo de Busca**: Input com ícone de lupa (max-width: 28rem)
  - **Notificações**: Dropdown com badge de contagem (3 notificações de exemplo)
  - **Menu do Usuário**: Avatar + nome/email + dropdown com opções
- **Funcionalidades**:
  - Busca global (placeholder para implementação futura)
  - Sistema de notificações com preview
  - Menu de perfil e logout
- **Visual**:
  - Border bottom e shadow-sm
  - Avatar com fallback de iniciais
  - Badges numerados para notificações

### 3. AppShell (`src/components/app-shell.tsx`)

Container principal que integra Sidebar + TopBar + Content:

- **Estrutura**:
  - Sidebar fixa (desktop) ou Sheet (mobile)
  - TopBar sticky no topo
  - Main content com padding responsivo
  - Footer com copyright e informações
- **Responsividade**:
  - Mobile: Sidebar como overlay/drawer (Sheet component)
  - Desktop: Sidebar fixa + conteúdo com margin-left
- **Gerenciamento de Estado**:
  - `isMobileMenuOpen`: Controla visibilidade do menu mobile
  - `toggleMobileMenu`: Alterna estado do menu
  - `closeMobileMenu`: Fecha menu ao clicar em link

### 4. Layout Raiz (`src/app/layout.tsx`)

- Atualizado para usar AppShell como wrapper de todo conteúdo
- Metadados atualizados para "EsferaORDO - Sistema de Gestão RER"
- Idioma alterado para pt-BR
- Fontes Geist Sans e Geist Mono mantidas

### 5. Dashboard (`src/app/page.tsx`)

Página inicial com exemplo de dashboard:

- **KPIs**: 4 cards com métricas principais
  - Membros Ativos
  - Conformidade
  - Receitas
  - Despesas
- **Ações Rápidas**: 4 botões de ações principais
- **Atividades Recentes**: Lista de últimas 3 atividades
- **Visual**: Cards com hover states, ícones coloridos, layout grid responsivo

### 6. Páginas de Módulos (Placeholders)

Criadas páginas básicas para todos os módulos do sistema:

- `/membros` - Gestão de membros
- `/presencas` - Registro de presenças
- `/mensalidades` - Controle de mensalidades
- `/financeiro` - Gestão financeira
- `/biblioteca` - Documentos e biblioteca
- `/inventario` - Controle de materiais
- `/quiz` - Sistema de perguntas
- `/comunicacao` - Envio de comunicados

Todas seguem o mesmo padrão:
- Título h1 + descrição
- Card placeholder "em desenvolvimento"
- Estilos consistentes com design system

## Dependências Instaladas

```bash
# Componentes shadcn/ui adicionados:
- input
- dropdown-menu
- avatar
- sheet
- button (já existia)
```

## Design System Aplicado

### Cores RER (do globals.css)

- **Primary (Verde)**: `oklch(0.45 0.15 145)` - Ações principais
- **Accent (Dourado)**: `oklch(0.75 0.14 85)` - CTAs e destaques
- **Destructive (Vermelho)**: `oklch(0.55 0.22 25)` - Alertas e perigos

### Tokens Utilizados

- `bg-sidebar` / `text-sidebar-foreground` - Cores da sidebar
- `bg-primary` / `text-primary-foreground` - Item ativo
- `bg-accent` / `text-accent-foreground` - Hover states
- `bg-card` / `text-card-foreground` - Cards de conteúdo
- `bg-muted` / `text-muted-foreground` - Textos secundários

### Responsividade

Breakpoints Tailwind CSS:
- **sm**: 640px
- **md**: 768px
- **lg**: 1024px (ponto de quebra da sidebar)
- **xl**: 1280px
- **2xl**: 1536px

## Como Usar

### Desenvolvimento

```bash
# Instalar dependências
cd app && npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar em http://localhost:3000
```

### Estrutura de Arquivos

```
src/
├── app/
│   ├── layout.tsx                 # Layout raiz com AppShell
│   ├── page.tsx                   # Dashboard
│   ├── membros/page.tsx          # Módulo Membros
│   ├── presencas/page.tsx        # Módulo Presenças
│   ├── mensalidades/page.tsx     # Módulo Mensalidades
│   ├── financeiro/page.tsx       # Módulo Financeiro
│   ├── biblioteca/page.tsx       # Módulo Biblioteca
│   ├── inventario/page.tsx       # Módulo Inventário
│   ├── quiz/page.tsx             # Módulo Quiz
│   └── comunicacao/page.tsx      # Módulo Comunicação
└── components/
    ├── app-shell.tsx             # Layout principal
    ├── sidebar.tsx               # Barra lateral
    ├── topbar.tsx                # Barra superior
    └── ui/                       # Componentes shadcn/ui
        ├── button.tsx
        ├── input.tsx
        ├── dropdown-menu.tsx
        ├── avatar.tsx
        └── sheet.tsx
```

## Características Técnicas

### Mobile-First

- Design pensado para dispositivos móveis primeiro
- Sidebar colapsável em telas pequenas
- Menu hamburguer em mobile
- Touch-optimized (botões e áreas clicáveis adequados)

### Acessibilidade

- Labels aria para botões de ícones
- Navegação via teclado suportada
- Contraste de cores adequado (WCAG AA)
- Estrutura semântica HTML

### Performance

- Server Components por padrão (Next.js App Router)
- Client Components apenas onde necessário ("use client")
- CSS otimizado via Tailwind CSS 4
- Build otimizado com Next.js 16

## Próximos Passos

1. **Autenticação**: Implementar sistema de login e JWT
2. **Dados Reais**: Conectar menu do usuário com dados da sessão
3. **Busca Global**: Implementar funcionalidade de busca
4. **Notificações**: Backend para notificações em tempo real
5. **Dark Mode**: Toggle de tema claro/escuro (cores já configuradas)
6. **Breadcrumbs**: Adicionar navegação hierárquica
7. **Módulos**: Implementar CRUDs de cada módulo

## Notas Técnicas

- **TypeScript**: Strict mode habilitado
- **ESLint**: Configurado com Next.js core-web-vitals
- **Tailwind CSS 4**: Usando @tailwindcss/postcss
- **Next.js 16**: App Router com Turbopack
- **React 19**: Versão mais recente

## Suporte

Para dúvidas sobre o AppShell, consulte:
- Documentação Next.js: https://nextjs.org/docs
- Documentação shadcn/ui: https://ui.shadcn.com/
- Documentação Tailwind CSS: https://tailwindcss.com/docs
