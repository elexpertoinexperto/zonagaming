// Uso:  node tools/listar-filtros.mjs
// Escribe tools/FILTROS-URLS.md con TODAS las subcategorías (filtros) actuales: URL en español, su equivalente en inglés
// y cuántos productos tiene cada una. Se genera a partir de productos.json, así siempre está al día.
import fs from 'node:fs';
const { construirFiltros, NOMBRES, GRUPOS } = await import('../src/lib/filtros.mjs');
const productos = JSON.parse(fs.readFileSync(new URL('../src/data/productos.json', import.meta.url), 'utf8'));
const SLUG_EN = { 'tarjetas-graficas': 'graphics-cards', procesadores: 'processors', 'memoria-ram': 'ram-memory', ssd: 'ssd', 'fuentes-de-poder': 'power-supplies', 'refrigeracion-liquida': 'liquid-cooling', 'refrigeracion-normal': 'air-cooling', 'gabinetes-gamer': 'gaming-cases', teclados: 'keyboards', mouse: 'gaming-mice', audifonos: 'headsets', monitores: 'gaming-monitors' };
const D = 'https://monckeygamer.com';
const filtros = construirFiltros(productos);
let total = 0, md = '# Subcategorías (filtros) del catálogo\n\nGenerado con `node tools/listar-filtros.mjs`. Cada subcategoría cuelga de su categoría madre y tiene su equivalente en inglés (hreflang recíproco).\n';
for (const [cat, lista] of Object.entries(filtros)) {
  total += lista.length;
  md += `\n## ${NOMBRES[cat].esTit} — ${D}/${cat}/  ·  ${D}/en/${SLUG_EN[cat]}/ (${lista.length} subcategorías)\n\n| Grupo | URL en español | URL en inglés | Productos |\n|---|---|---|---|\n`;
  for (const f of lista) md += `| ${GRUPOS[f.grupo].es} | /${cat}/${f.slugEs}/ | /en/${SLUG_EN[cat]}/${f.slugEn}/ | ${f.total} |\n`;
}
md = md.replace('\n\n## ', `\n**Total: ${total} subcategorías × 2 idiomas = ${total * 2} páginas nuevas.**\n\n## `);
fs.writeFileSync(new URL('./FILTROS-URLS.md', import.meta.url), md);
console.log(`${total} subcategorías (${total * 2} URLs) → tools/FILTROS-URLS.md`);
