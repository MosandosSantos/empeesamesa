# 🎨 Como Trocar a Cor do Botão de Login

## Opção Rápida: Escolher uma das 5 sugestões

### 1. COMPLEMENTAR - Turquesa (#47aea9)
**Contraste máximo, destaca muito**

```css
/* Edite: app/src/app/globals.css linha ~99 */
--login-button: oklch(0.66 0.10 185);
--login-button-hover: oklch(0.61 0.10 185);
```

### 2. TRIÁDICA - Verde (#4d9d48) ✅ ATUAL
**Equilibrado e energético**

```css
--login-button: oklch(0.58 0.12 140);
--login-button-hover: oklch(0.53 0.12 140);
```

### 3. ANÁLOGA - Laranja Terroso (#bb7a44)
**Harmonia suave com a imagem**

```css
--login-button: oklch(0.63 0.11 55);
--login-button-hover: oklch(0.58 0.11 55);
```

### 4. ESMERALDA - Verde Água (#1dc98f)
**Profissional e confiante**

```css
--login-button: oklch(0.70 0.15 165);
--login-button-hover: oklch(0.65 0.15 165);
```

### 5. DOURADO - Amarelo Ouro (#e6b319)
**Premium e chamativo**

```css
--login-button: oklch(0.75 0.16 95);
--login-button-hover: oklch(0.70 0.16 95);
```

---

## Como Aplicar:

1. Abra o arquivo: `app/src/app/globals.css`

2. Procure pelas linhas (aproximadamente linha 99):

```css
/* Login Button Color - Harmonic with background image */
--login-button: oklch(0.58 0.12 140);        ← AQUI
--login-button-foreground: oklch(0.98 0 0);
--login-button-hover: oklch(0.53 0.12 140);  ← E AQUI
```

3. Substitua pelos valores da cor escolhida

4. Salve o arquivo

5. O servidor de desenvolvimento recarrega automaticamente!

---

## Converter suas próprias cores (HEX → OKLCH):

Use: https://oklch.com/

Exemplo:
- **HEX:** `#4d9d48`
- **OKLCH:** `oklch(0.58 0.12 140)`

---

## Dica: Preview das Cores

Abra o arquivo gerado pela análise:
```
app/scripts/login-colors.json
```

Lá tem todas as cores em HEX, RGB, HSL e as recomendações.
