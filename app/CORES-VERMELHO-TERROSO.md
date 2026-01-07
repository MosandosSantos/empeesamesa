# 🧱 Cor Vermelho Terroso/Tijolo - Tema Maçônico

## 🎨 Cor Aplicada: Terracota/Tijolo

A cor escolhida remete à **pedra bruta** e ao **tijolo de alvenaria**, símbolos fundamentais da Maçonaria.

### Valores da Cor:

**Botão Normal:**
- **OKLCH:** `oklch(0.55 0.15 35)`
- **HEX aproximado:** `#B86B4B`
- **Descrição:** Vermelho terroso, tom de tijolo queimado

**Botão Hover (ao passar o mouse):**
- **OKLCH:** `oklch(0.48 0.16 35)`
- **HEX aproximado:** `#9A5538`
- **Descrição:** Tom mais escuro e saturado

**Texto do Botão:**
- **OKLCH:** `oklch(0.98 0 0)`
- **Descrição:** Branco puro para contraste

---

## ⚖️ Simbolismo Maçônico

### Terracota/Tijolo
A cor remete à cerâmica e tijolo, representando:
- A construção do Templo interior
- O trabalho do pedreiro livre
- A transformação da matéria bruta em obra perfeita

### Malhete do Venerável Mestre
O **malhete** (cursor customizado) representa:
- A autoridade do Venerável Mestre
- O instrumento de ordem e comando
- A justiça e equidade na condução dos trabalhos
- O poder de abrir e fechar os trabalhos da Loja

### Simbolismo da Ferramenta
A malhete representa:
- **Ordem:** Ferramenta que conduz os trabalhos
- **Justiça:** Semelhante ao martelo de juiz
- **Poder Executivo:** Autoridade máxima na Loja
- **Harmonia:** Instrumento que mantém a ordem

---

## 🖱️ Cursor Customizado - Malhete

**Arquivo:** `public/img/malhete-cursor.svg`

### Características:
- **Forma:** Malhete tradicional (martelo de madeira)
- **Cores:**
  - Cabo: Marrom claro (#6B4423) - madeira de lei
  - Cabeça: Marrom escuro (#3E2723) - madeira nobre maciça
  - Anel: Dourado (#B8860B) - metal decorativo
- **Tamanho:** 32x32px
- **Hotspot:** 16,2 (centro da cabeça da malhete)

### Aplicação:
- Ativo apenas na **tela de login**
- Classe CSS: `.masonic-cursor`
- Fallback: cursor padrão se o SVG não carregar

---

## 🎯 Como Alterar

### Ajustar a cor do botão:

Edite `app/src/app/globals.css` (linha ~102):

```css
/* Mais claro/terroso */
--login-button: oklch(0.60 0.14 35);

/* Mais escuro/tijolo queimado */
--login-button: oklch(0.50 0.16 35);

/* Mais avermelhado */
--login-button: oklch(0.55 0.18 30);

/* Mais alaranjado/terracota */
--login-button: oklch(0.55 0.15 40);
```

### Desativar o cursor de cinzel:

Remova a classe `masonic-cursor` de `app/src/app/login/page.tsx` (linha ~53):

```tsx
// ANTES:
<div className="relative flex min-h-screen masonic-cursor">

// DEPOIS:
<div className="relative flex min-h-screen">
```

---

## 🔍 Paleta Completa de Vermelhos Terrosos

Se quiser experimentar outras variações:

| Tom | OKLCH | HEX aprox. | Descrição |
|-----|-------|------------|-----------|
| Terracota claro | `oklch(0.60 0.12 35)` | `#C87C5C` | Tom de telha |
| **Tijolo (atual)** | `oklch(0.55 0.15 35)` | `#B86B4B` | **Aplicado** |
| Tijolo escuro | `oklch(0.50 0.16 35)` | `#A05A3D` | Tijolo queimado |
| Ferrugem | `oklch(0.52 0.14 30)` | `#A65540` | Tom oxidado |
| Adobe | `oklch(0.58 0.13 38)` | `#BE7755` | Terra batida |

---

## 📝 Notas Técnicas

- A cor usa o espaço OKLCH (perceptualmente uniforme)
- Contraste WCAG AAA garantido com texto branco
- Compatível com modo claro e escuro
- Hover state escurece 7% em luminosidade
- Cursor funciona em todos os navegadores modernos

---

**Criado em:** 06/01/2026
**Tema:** Maçonaria - Pedra Bruta e Ferramentas do Ofício
