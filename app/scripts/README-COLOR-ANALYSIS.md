# 🎨 Análise de Cores da Tela de Login

Este sistema analisa automaticamente a imagem de fundo da tela de login e gera sugestões de cores harmônicas para o botão de login.

## Como Funciona

### 1. Análise Automática

O script `analyze-colors-simple.js` usa a biblioteca **Sharp** para:

1. **Carregar a imagem** de login (`public/img/login.png`)
2. **Redimensionar** para 200x200px (análise rápida)
3. **Extrair pixels RGB** e ignorar pixels muito escuros/claros
4. **Calcular cores dominantes** agrupando cores próximas
5. **Calcular cor média** da imagem
6. **Gerar cores harmônicas** usando teoria das cores

### 2. Teoria das Cores Aplicada

O sistema gera 5 sugestões de cores harmônicas:

#### 1️⃣ **Complementar** (Contraste Máximo)
- Cor oposta no círculo cromático (180°)
- Saturação aumentada (+25%)
- **Uso:** Melhor para destacar o botão

#### 2️⃣ **Triádica** (Vibrante e Equilibrado)
- 120° no círculo cromático
- Saturação aumentada (+20%)
- **Uso:** Energético e balanceado

#### 3️⃣ **Análoga Brilhante** (Harmonia Suave)
- 30° no círculo cromático
- Mantém a saturação
- **Uso:** Se integra bem com a imagem

#### 4️⃣ **Verde Esmeralda** (Profissional)
- HSL(160°, 75%, 45%)
- **Uso:** Transmite confiança e ação

#### 5️⃣ **Dourado** (Elegante)
- HSL(45°, 80%, 50%)
- **Uso:** Premium e chamativo

### 3. Recomendação Inteligente

O sistema analisa a imagem e recomenda automaticamente:

- **Imagem escura** → Cor vibrante clara
- **Imagem dessaturada** → Cor saturada
- **Imagem vibrante** → Cor complementar

## Como Usar

### Executar Análise

```bash
cd app
npm run analyze:login-colors
```

### Resultados

O script gera:

1. **Output no terminal** com todas as sugestões
2. **Arquivo JSON** (`scripts/login-colors.json`) com dados completos

### Exemplo de Output

```
🎨 CORES DOMINANTES:
1. #a96f6d - 6.3% - HSL(2°, 26%, 55%)
2. #45425d - 6.2% - HSL(247°, 17%, 31%)
...

📊 COR MÉDIA: #8c6466 - HSL(357°, 17%, 47%)

✨ SUGESTÕES PARA BOTÃO DE LOGIN:
1. COMPLEMENTAR: #47aea9 - ✓ Melhor para destacar
2. TRIÁDICA: #4d9d48 - ✓ Equilibrado
...

💡 RECOMENDAÇÃO: #4d9d48 (Triádica)
   Imagem tem cores NEUTRAS/DESSATURADAS
   → Use cor SATURADA para destacar
```

## Aplicar Cores

### 1. Variáveis CSS Customizadas

As cores são aplicadas via variáveis CSS em `app/globals.css`:

```css
:root {
  /* Login Button - Harmonic with background */
  --login-button: oklch(0.58 0.12 140);
  --login-button-foreground: oklch(0.98 0 0);
  --login-button-hover: oklch(0.53 0.12 140);
}
```

### 2. Componente de Login

O botão usa classes Tailwind que referenciam as variáveis:

```tsx
<Button className="bg-login-button hover:bg-login-button-hover text-login-button-foreground">
  Entrar
</Button>
```

## Trocar Imagem de Login

Se você trocar a imagem de fundo:

1. **Substitua** o arquivo `public/img/login.png`
2. **Execute** a análise:
   ```bash
   npm run analyze:login-colors
   ```
3. **Revise** as sugestões no terminal
4. **Atualize** as variáveis CSS em `globals.css` com a cor recomendada
5. **Reinicie** o servidor de desenvolvimento

## Conversão de Cores

### HEX → OKLCH

O sistema usa **OKLCH** (espaço de cores perceptualmente uniforme):

```
HEX: #4d9d48
↓
RGB: (77, 157, 72)
↓
HSL: (117°, 37%, 45%)
↓
OKLCH: oklch(0.58 0.12 140)
```

### Parâmetros OKLCH

- **L (Lightness)**: 0-1 (0 = preto, 1 = branco)
- **C (Chroma)**: 0-0.4 (saturação)
- **H (Hue)**: 0-360° (matiz)

## Arquivos Envolvidos

```
app/
├── scripts/
│   ├── analyze-colors-simple.js    # Script de análise
│   ├── login-colors.json          # Resultados (gerado)
│   └── README-COLOR-ANALYSIS.md   # Esta documentação
├── public/img/
│   └── login.png                  # Imagem analisada
├── src/app/
│   ├── globals.css                # Variáveis CSS
│   └── login/page.tsx             # Componente de login
└── package.json                   # Script npm
```

## Histórico

- **06/01/2026**: Sistema de análise criado
  - Imagem analisada: `login.png` (1536x1024px)
  - Cor recomendada: `#4d9d48` (Verde triádico)
  - Aplicado: `oklch(0.58 0.12 140)`
  - Razão: Imagem com cores neutras/dessaturadas

## Referências

- [OKLCH Color Space](https://oklch.com/)
- [Color Theory](https://www.interaction-design.org/literature/article/the-color-system)
- [Sharp Image Processing](https://sharp.pixelplumbing.com/)
