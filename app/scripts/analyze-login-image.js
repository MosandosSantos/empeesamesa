const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * Extrai cores dominantes de uma imagem usando Canvas API
 */
async function analyzeImageColors() {
  console.log('🎨 Iniciando análise de cores da imagem de login...\n');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Caminho da imagem
  const imagePath = path.join(__dirname, '../public/img/login.png');
  const imageUrl = `file://${imagePath.replace(/\\/g, '/')}`;

  console.log(`📸 Analisando imagem: ${imagePath}\n`);

  // Criar uma página HTML simples que carrega a imagem e analisa as cores
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { margin: 0; padding: 20px; background: #000; }
          canvas { display: block; max-width: 100%; }
        </style>
      </head>
      <body>
        <img id="sourceImage" crossorigin="anonymous" style="display:none">
        <canvas id="canvas"></canvas>
        <div id="results" style="color: white; font-family: monospace; margin-top: 20px;"></div>
      </body>
    </html>
  `);

  // Função JavaScript para análise de cores
  const colorAnalysis = await page.evaluate((imgSrc) => {
    return new Promise((resolve) => {
      const img = document.getElementById('sourceImage');
      const canvas = document.getElementById('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = function() {
        // Reduzir tamanho para análise mais rápida
        const maxSize = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height *= maxSize / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width *= maxSize / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Pegar dados de pixels
        const imageData = ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;

        // Contar cores (agrupando por proximidade)
        const colorMap = {};
        const step = 4; // Pular alguns pixels para performance

        for (let i = 0; i < pixels.length; i += step * 4) {
          const r = Math.round(pixels[i] / 10) * 10;
          const g = Math.round(pixels[i + 1] / 10) * 10;
          const b = Math.round(pixels[i + 2] / 10) * 10;
          const a = pixels[i + 3];

          // Ignorar pixels muito transparentes ou muito escuros/claros
          if (a < 100) continue;
          const brightness = (r + g + b) / 3;
          if (brightness < 20 || brightness > 240) continue;

          const key = `${r},${g},${b}`;
          colorMap[key] = (colorMap[key] || 0) + 1;
        }

        // Encontrar as 10 cores mais dominantes
        const sortedColors = Object.entries(colorMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([color, count]) => {
            const [r, g, b] = color.split(',').map(Number);
            return {
              rgb: { r, g, b },
              hex: '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''),
              count,
              hsl: rgbToHsl(r, g, b)
            };
          });

        // Calcular cor média
        let totalR = 0, totalG = 0, totalB = 0, totalCount = 0;
        sortedColors.forEach(c => {
          totalR += c.rgb.r * c.count;
          totalG += c.rgb.g * c.count;
          totalB += c.rgb.b * c.count;
          totalCount += c.count;
        });

        const avgColor = {
          r: Math.round(totalR / totalCount),
          g: Math.round(totalG / totalCount),
          b: Math.round(totalB / totalCount)
        };

        resolve({
          dominantColors: sortedColors,
          averageColor: {
            rgb: avgColor,
            hex: '#' + [avgColor.r, avgColor.g, avgColor.b].map(x => x.toString(16).padStart(2, '0')).join(''),
            hsl: rgbToHsl(avgColor.r, avgColor.g, avgColor.b)
          }
        });
      };

      img.src = imgSrc;

      function rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
          h = s = 0;
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }

        return {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          l: Math.round(l * 100)
        };
      }
    });
  }, imageUrl);

  await browser.close();

  // Exibir resultados
  console.log('🎨 CORES DOMINANTES NA IMAGEM:\n');
  colorAnalysis.dominantColors.forEach((color, index) => {
    console.log(`${index + 1}. ${color.hex} - HSL(${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%) - Count: ${color.count}`);
  });

  console.log('\n📊 COR MÉDIA DA IMAGEM:\n');
  console.log(`   RGB: (${colorAnalysis.averageColor.rgb.r}, ${colorAnalysis.averageColor.rgb.g}, ${colorAnalysis.averageColor.rgb.b})`);
  console.log(`   HEX: ${colorAnalysis.averageColor.hex}`);
  console.log(`   HSL: (${colorAnalysis.averageColor.hsl.h}°, ${colorAnalysis.averageColor.hsl.s}%, ${colorAnalysis.averageColor.hsl.l}%)`);

  // Gerar cores harmônicas
  const harmonicColors = generateHarmonicColors(colorAnalysis);

  console.log('\n✨ SUGESTÕES DE CORES HARMÔNICAS PARA O BOTÃO:\n');
  console.log(`1. Complementar (oposta): ${harmonicColors.complementary.hex}`);
  console.log(`   HSL: (${harmonicColors.complementary.hsl.h}°, ${harmonicColors.complementary.hsl.s}%, ${harmonicColors.complementary.hsl.l}%)`);
  console.log(`   Descrição: Cria contraste máximo\n`);

  console.log(`2. Análoga (vizinha): ${harmonicColors.analogous.hex}`);
  console.log(`   HSL: (${harmonicColors.analogous.hsl.h}°, ${harmonicColors.analogous.hsl.s}%, ${harmonicColors.analogous.hsl.l}%)`);
  console.log(`   Descrição: Harmonia suave\n`);

  console.log(`3. Triádica: ${harmonicColors.triadic.hex}`);
  console.log(`   HSL: (${harmonicColors.triadic.hsl.h}°, ${harmonicColors.triadic.hsl.s}%, ${harmonicColors.triadic.hsl.l}%)`);
  console.log(`   Descrição: Vibrante e equilibrado\n`);

  console.log(`4. Saturada da imagem: ${harmonicColors.saturated.hex}`);
  console.log(`   HSL: (${harmonicColors.saturated.hsl.h}°, ${harmonicColors.saturated.hsl.s}%, ${harmonicColors.saturated.hsl.l}%)`);
  console.log(`   Descrição: Versão mais vibrante da cor dominante\n`);

  // Salvar em arquivo JSON
  const results = {
    dominantColors: colorAnalysis.dominantColors,
    averageColor: colorAnalysis.averageColor,
    harmonicColors
  };

  const outputPath = path.join(__dirname, 'login-colors.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`💾 Resultados salvos em: ${outputPath}\n`);

  return results;
}

/**
 * Gera cores harmônicas baseadas na análise
 */
function generateHarmonicColors(analysis) {
  const baseHsl = analysis.averageColor.hsl;

  // 1. Cor complementar (180° oposta)
  const complementary = {
    h: (baseHsl.h + 180) % 360,
    s: Math.min(baseHsl.s + 20, 100), // Aumentar saturação
    l: Math.max(baseHsl.l - 10, 40) // Ajustar luminosidade para ser visível
  };

  // 2. Cor análoga (30° vizinha)
  const analogous = {
    h: (baseHsl.h + 30) % 360,
    s: baseHsl.s,
    l: baseHsl.l
  };

  // 3. Cor triádica (120°)
  const triadic = {
    h: (baseHsl.h + 120) % 360,
    s: Math.min(baseHsl.s + 15, 100),
    l: Math.max(baseHsl.l - 5, 45)
  };

  // 4. Versão saturada da cor base (bom para botões)
  const saturated = {
    h: baseHsl.h,
    s: Math.min(baseHsl.s + 30, 90),
    l: 45 // Luminosidade ideal para botões
  };

  return {
    complementary: { ...complementary, hex: hslToHex(complementary) },
    analogous: { ...analogous, hex: hslToHex(analogous) },
    triadic: { ...triadic, hex: hslToHex(triadic) },
    saturated: { ...saturated, hex: hslToHex(saturated) }
  };
}

/**
 * Converte HSL para HEX
 */
function hslToHex(hsl) {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = x => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Executar análise
analyzeImageColors().catch(console.error);
