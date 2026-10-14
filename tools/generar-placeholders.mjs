// Uso:  node tools/generar-placeholders.mjs
// Genera las imágenes de "imagen no disponible" por tipo de componente e idioma:
//   public/placeholder-<categoria>-es.svg  y  public/placeholder-<categoria>-en.svg
// y deja en productos.json (es) y productos-en.json (en) cada producto sin foto apuntando a la de su categoría.
// Es idempotente: se puede volver a ejecutar sin cambiar nada si no hay productos nuevos sin imagen.
// El nombre empieza por "placeholder" a propósito: el resto del código (SiteLayout, FiltroPagina, descargar-imagenes)
// reconoce así que el producto no tiene foto real.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

// icono (rejilla 24x24, trazo) por categoría: mismos dibujos que src/components/CategoryIcon.astro
const ICONOS = {
  'tarjetas-graficas': ['gpu', 'Tarjeta gráfica', 'Graphics card', '<rect x="3" y="6" width="14" height="10" rx="2"/><path d="M7 10h4"/><path d="M17 9h4"/><path d="M17 13h4"/><path d="M8 18h4"/>'],
  procesadores: ['cpu', 'Procesador', 'Processor', '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M9 1v3"/><path d="M15 1v3"/><path d="M9 20v3"/><path d="M15 20v3"/><path d="M1 9h3"/><path d="M1 15h3"/><path d="M20 9h3"/><path d="M20 15h3"/>'],
  'memoria-ram': ['ram', 'Memoria RAM', 'RAM memory', '<rect x="3" y="8" width="18" height="8" rx="2"/><path d="M6 16v3"/><path d="M10 16v3"/><path d="M14 16v3"/><path d="M18 16v3"/><path d="M7 11h2"/><path d="M11 11h2"/><path d="M15 11h2"/>'],
  ssd: ['ssd', 'SSD', 'SSD', '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M9 7h6"/><path d="M9 11h6"/><path d="M10 18h4"/>'],
  'fuentes-de-poder': ['psu', 'Fuente de poder', 'Power supply', '<rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M12 8v8"/><path d="M8 12h8"/>'],
  'refrigeracion-liquida': ['aio', 'Refrigeración líquida', 'Liquid cooling', '<path d="M12 3s6 6 6 11a6 6 0 0 1-12 0c0-5 6-11 6-11Z"/><path d="M9 15a3 3 0 0 0 6 0"/>'],
  'refrigeracion-normal': ['fan', 'Refrigeración por aire', 'Air cooling', '<circle cx="12" cy="12" r="2"/><path d="M12 10c-1-5 4-7 7-4 1 4-2 7-7 6"/><path d="M14 13c5-1 7 4 4 7-4 1-7-2-6-7"/><path d="M10 13c-5 1-7-4-4-7 4-1 7 2 6 7"/>'],
  'gabinetes-gamer': ['box', 'Gabinete', 'PC case', '<path d="M5 4h14v16H5z"/><path d="M8 8h8"/><path d="M8 12h4"/><circle cx="16" cy="17" r="1"/>'],
  teclados: ['keyboard', 'Teclado', 'Keyboard', '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 10h.01"/><path d="M11 10h.01"/><path d="M15 10h.01"/><path d="M8 14h8"/>'],
  mouse: ['mouse', 'Mouse', 'Mouse', '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 3v6"/><path d="M7 10h10"/>'],
  audifonos: ['audio', 'Audífonos', 'Headset', '<path d="M4 13a8 8 0 0 1 16 0"/><path d="M4 13v4a2 2 0 0 0 2 2h2v-6H6a2 2 0 0 0-2 2"/><path d="M20 13v4a2 2 0 0 1-2 2h-2v-6h2a2 2 0 0 1 2 2"/>'],
  monitores: ['monitor', 'Monitor', 'Monitor', '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>'],
};

const TEXTOS = {
  es: { titulo: 'Imagen no disponible por el momento', l1: 'Imagen no disponible', l2: 'por el momento', pie: 'Para ver la imagen, clic en el botón Amazon', idx: 1 },
  en: { titulo: 'Image not available at the moment', l1: 'Image not available', l2: 'at the moment', pie: 'To see the image, click the Amazon button', idx: 2 },
};

const svg = (cat, lang) => {
  const [, , , trazo] = ICONOS[cat];
  const t = TEXTOS[lang];
  const etiqueta = ICONOS[cat][t.idx];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" role="img" aria-label="${t.titulo}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d1a2b"/><stop offset="1" stop-color="#05070b"/></linearGradient>
    <linearGradient id="ac" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7cffcb"/><stop offset="1" stop-color="#1bb7ff"/></linearGradient>
    <radialGradient id="gl" cx="50%" cy="38%" r="45%"><stop offset="0" stop-color="#7cffcb" stop-opacity="0.16"/><stop offset="1" stop-color="#7cffcb" stop-opacity="0"/></radialGradient>
    <pattern id="gr" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#7cffcb" stroke-opacity="0.05"/></pattern>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <rect width="800" height="500" fill="url(#gr)"/>
  <rect width="800" height="500" fill="url(#gl)"/>
  <circle cx="400" cy="128" r="84" fill="none" stroke="url(#ac)" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="3 12" stroke-linecap="round"/>
  <rect x="346" y="74" width="108" height="108" rx="28" fill="#0b1118" stroke="url(#ac)" stroke-opacity="0.7" stroke-width="2"/>
  <g transform="translate(368 96) scale(2.7)" fill="none" stroke="url(#ac)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${trazo}</g>
  <text x="400" y="272" text-anchor="middle" fill="#e6f7ff" font-family="system-ui, 'Segoe UI', Roboto, Arial, sans-serif" font-size="50" font-weight="700">${t.l1}</text>
  <text x="400" y="330" text-anchor="middle" fill="#e6f7ff" font-family="system-ui, 'Segoe UI', Roboto, Arial, sans-serif" font-size="50" font-weight="700">${t.l2}</text>
  <text x="400" y="400" text-anchor="middle" fill="#7cffcb" font-family="system-ui, 'Segoe UI', Roboto, Arial, sans-serif" font-size="31" font-weight="500">${t.pie}</text>
  <text x="400" y="462" text-anchor="middle" fill="#e6f7ff" fill-opacity="0.4" font-family="system-ui, 'Segoe UI', Roboto, Arial, sans-serif" font-size="18" letter-spacing="3">${etiqueta.toUpperCase()} · MONCKEY GAMER</text>
</svg>
`;
};

for (const cat of Object.keys(ICONOS)) {
  for (const lang of ['es', 'en']) fs.writeFileSync(path.join(root, `public/placeholder-${cat}-${lang}.svg`), svg(cat, lang));
}

let cambiados = 0;
for (const [archivo, lang] of [['src/data/productos.json', 'es'], ['src/data/productos-en.json', 'en']]) {
  const ruta = path.join(root, archivo);
  const datos = JSON.parse(fs.readFileSync(ruta, 'utf8'));
  for (const [cat, lista] of Object.entries(datos)) {
    if (!ICONOS[cat]) continue;
    for (const p of lista) {
      if (!String(p.imagenUrl).includes('placeholder')) continue;
      const nuevo = `/placeholder-${cat}-${lang}.svg`;
      if (p.imagenUrl !== nuevo) { p.imagenUrl = nuevo; cambiados++; }
    }
  }
  fs.writeFileSync(ruta, JSON.stringify(datos, null, 2));
}
console.log(`SVG generados: ${Object.keys(ICONOS).length * 2} · productos actualizados: ${cambiados}`);
