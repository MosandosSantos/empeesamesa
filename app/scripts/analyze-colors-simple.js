const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function analyzeLoginImage() {
  console.log('🎨 Analisando cores da imagem de login...\n');

  const imagePath = path.join(__dirname, '../public/img/login.png');

  try {
    // Carregar imagem e extrair estatísticas
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    console.log(`📸 Imagem: ${metadata.width}x${metadata.height}px\n`);

    // Redimensionar para análise rápida
    const resized = await image
      .resize(200, 200, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = resized;
    const pixels = [];

    // Extrair pixels RGB
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Ignorar pixels muito escuros ou muito claros
      const brightness = (r + g + b) / 3;
      if (brightness > 20 && brightness < 240) {
        pixels.push({ r, g, b });
      }
    }

    // Calcular cor média
    const avg = {
      r: Math.round(pixels.reduce((sum, p) => sum + p.r, 0) / pixels.length),
      g: Math.round(pixels.reduce((sum, p) => sum + p.g, 0) / pixels.length),
      b: Math.round(pixels.reduce((sum, p) => sum + p.b, 0) / pixels.length)
    };

    // Agrupar cores próximas
    const colorGroups = {};
    const groupSize = 20;

    pixels.forEach(p => {
      const key = `${Math.floor(p.r / groupSize) * groupSize},${Math.floor(p.g / groupSize) * groupSize},${Math.floor(p.b / groupSize) * groupSize}`;
      if (!colorGroups[key]) {
        colorGroups[key] = { count: 0, r: 0, g: 0, b: 0 };
      }
      colorGroups[key].count++;
      colorGroups[key].r += p.r;
      colorGroups[key].g += p.g;
      colorGroups[key].b += p.b;
    });

    // Encontrar cores dominantes
    const dominantColors = Object.entries(colorGroups)
      .map(([_, group]) => ({
        r: Math.round(group.r / group.count),
        g: Math.round(group.g / group.count),
        b: Math.round(group.b / group.count),
        count: group.count,
        percentage: ((group.count / pixels.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    console.log('🎨 CORES DOMINANTES:\n');
    dominantColors.forEach((color, i) => {
      const hex = rgbToHex(color.r, color.g, color.b);
      const hsl = rgbToHsl(color.r, color.g, color.b);
      console.log(`${i + 1}. ${hex} - ${color.percentage}% - HSL(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`);
    });

    const avgHsl = rgbToHsl(avg.r, avg.g, avg.b);
    const avgHex = rgbToHex(avg.r, avg.g, avg.b);

    console.log(`\n📊 COR MÉDIA: ${avgHex} - HSL(${avgHsl.h}°, ${avgHsl.s}%, ${avgHsl.l}%)\n`);

    // Gerar cores harmônicas para o botão
    console.log('✨ SUGESTÕES PARA BOTÃO DE LOGIN:\n');

    // 1. Complementar
    const complementary = {
      h: (avgHsl.h + 180) % 360,
      s: Math.min(avgHsl.s + 25, 85),
      l: 48
    };
    const compHex = hslToHex(complementary);
    console.log(`1. COMPLEMENTAR (Contraste máximo)`);
    console.log(`   ${compHex} - HSL(${complementary.h}°, ${complementary.s}%, ${complementary.l}%)`);
    console.log(`   ✓ Melhor para destacar o botão\n`);

    // 2. Triádica
    const triadic = {
      h: (avgHsl.h + 120) % 360,
      s: Math.min(avgHsl.s + 20, 80),
      l: 45
    };
    const triadicHex = hslToHex(triadic);
    console.log(`2. TRIÁDICA (Vibrante)`);
    console.log(`   ${triadicHex} - HSL(${triadic.h}°, ${triadic.s}%, ${triadic.l}%)`);
    console.log(`   ✓ Equilibrado e energético\n`);

    // 3. Análoga brilhante
    const analogousBright = {
      h: (avgHsl.h + 30) % 360,
      s: Math.min(avgHsl.s + 30, 90),
      l: 50
    };
    const analogousHex = hslToHex(analogousBright);
    console.log(`3. ANÁLOGA BRILHANTE (Harmonia suave)`);
    console.log(`   ${analogousHex} - HSL(${analogousBright.h}°, ${analogousBright.s}%, ${analogousBright.l}%)`);
    console.log(`   ✓ Se integra bem com a imagem\n`);

    // 4. Verde esmeralda (profissional)
    const emerald = { h: 160, s: 75, l: 45 };
    const emeraldHex = hslToHex(emerald);
    console.log(`4. VERDE ESMERALDA (Profissional)`);
    console.log(`   ${emeraldHex} - HSL(${emerald.h}°, ${emerald.s}%, ${emerald.l}%)`);
    console.log(`   ✓ Transmite confiança e ação\n`);

    // 5. Dourado (elegante)
    const golden = { h: 45, s: 80, l: 50 };
    const goldenHex = hslToHex(golden);
    console.log(`5. DOURADO (Elegante)`);
    console.log(`   ${goldenHex} - HSL(${golden.h}°, ${golden.s}%, ${golden.l}%)`);
    console.log(`   ✓ Premium e chamativo\n`);

    // Recomendação baseada nas cores da imagem
    const mostDominant = dominantColors[0];
    const domHsl = rgbToHsl(mostDominant.r, mostDominant.g, mostDominant.b);

    console.log('💡 RECOMENDAÇÃO BASEADA NA IMAGEM:\n');

    let recommended;
    if (domHsl.l < 30) {
      // Imagem escura - usar cor clara/vibrante
      recommended = emerald;
      console.log(`   A imagem é predominantemente ESCURA`);
      console.log(`   → Use uma cor VIBRANTE para contraste`);
      console.log(`   → Sugestão: ${emeraldHex} (Verde Esmeralda)\n`);
    } else if (domHsl.s < 30) {
      // Imagem dessaturada - usar cor saturada
      recommended = triadic;
      console.log(`   A imagem tem cores NEUTRAS/DESSATURADAS`);
      console.log(`   → Use uma cor SATURADA para destacar`);
      console.log(`   → Sugestão: ${triadicHex} (Triádica)\n`);
    } else {
      // Usar complementar
      recommended = complementary;
      console.log(`   A imagem tem cores VIBRANTES`);
      console.log(`   → Use cor COMPLEMENTAR para equilíbrio`);
      console.log(`   → Sugestão: ${compHex} (Complementar)\n`);
    }

    // Salvar resultados
    const results = {
      averageColor: { rgb: avg, hex: avgHex, hsl: avgHsl },
      dominantColors: dominantColors.map(c => ({
        rgb: { r: c.r, g: c.g, b: c.b },
        hex: rgbToHex(c.r, c.g, c.b),
        hsl: rgbToHsl(c.r, c.g, c.b),
        percentage: c.percentage
      })),
      recommendations: {
        complementary: { ...complementary, hex: compHex },
        triadic: { ...triadic, hex: triadicHex },
        analogous: { ...analogousBright, hex: analogousHex },
        emerald: { ...emerald, hex: emeraldHex },
        golden: { ...golden, hex: goldenHex },
        recommended: { ...recommended, hex: hslToHex(recommended) }
      }
    };

    const outputPath = path.join(__dirname, 'login-colors.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`💾 Resultados salvos: ${outputPath}\n`);

    return results;

  } catch (error) {
    console.error('❌ Erro ao analisar imagem:', error.message);
    process.exit(1);
  }
}

// Funções auxiliares
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

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

// Executar
analyzeLoginImage().catch(console.error);
