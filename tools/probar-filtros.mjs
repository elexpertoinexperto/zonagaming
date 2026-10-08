// Uso:  npm run build && node tools/probar-filtros.mjs
// Comprueba sobre dist/ que TODAS las subcategorías (filtros) están bien:
//  - existen en español e inglés, con hreflang recíproco correcto (cada una apunta a su equivalente);
//  - están en sitemap-es.xml y sitemap-en.xml;
//  - tienen title, description (≤160), canonical, OG, un solo H1, migas de pan y ItemList válidos;
//  - títulos y descripciones únicos en todo el sitio;
//  - enlazan a su categoría madre y la madre las enlaza a ellas;
//  - ningún filtro pisa una ficha de producto.
import fs from 'node:fs';

const SITE = 'https://monckeygamer.com';
const leer = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const { construirFiltros } = await import('../src/lib/filtros.mjs');
const productos = leer('src/data/productos.json');
const SLUG_EN = { 'tarjetas-graficas': 'graphics-cards', procesadores: 'processors', 'memoria-ram': 'ram-memory', ssd: 'ssd', 'fuentes-de-poder': 'power-supplies', 'refrigeracion-liquida': 'liquid-cooling', 'refrigeracion-normal': 'air-cooling', 'gabinetes-gamer': 'gaming-cases', teclados: 'keyboards', mouse: 'gaming-mice', audifonos: 'headsets', monitores: 'gaming-monitors' };
const filtros = construirFiltros(productos);
const sitemapEs = fs.readFileSync('dist/sitemap-es.xml', 'utf8');
const sitemapEn = fs.readFileSync('dist/sitemap-en.xml', 'utf8');
const errores = [];
const err = (m) => errores.push(m);
const titulos = new Map(), descripciones = new Map();
let n = 0;
const g = (h, re) => (h.match(re) || [])[1] || '';

for (const [cat, lista] of Object.entries(filtros)) {
  const madreEs = fs.readFileSync(`dist/${cat}/index.html`, 'utf8');
  const madreEn = fs.readFileSync(`dist/en/${SLUG_EN[cat]}/index.html`, 'utf8');
  for (const f of lista) {
    for (const lang of ['es', 'en']) {
      n++;
      const ruta = lang === 'es' ? `/${cat}/${f.slugEs}/` : `/en/${SLUG_EN[cat]}/${f.slugEn}/`;
      const otra = lang === 'es' ? `/en/${SLUG_EN[cat]}/${f.slugEn}/` : `/${cat}/${f.slugEs}/`;
      const arch = `dist${ruta}index.html`;
      if (!fs.existsSync(arch)) { err(`${ruta}: no existe`); continue; }
      const h = fs.readFileSync(arch, 'utf8');
      const title = g(h, /<title>([^<]*)<\/title>/), desc = g(h, /name="description" content="([^"]*)"/);
      if (!title) err(`${ruta}: sin title`);
      if (title.length > 70) err(`${ruta}: title largo (${title.length})`);
      if (!desc || desc.length > 165) err(`${ruta}: description ausente o larga (${desc.length})`);
      if (g(h, /rel="canonical" href="([^"]*)"/) !== SITE + ruta) err(`${ruta}: canonical incorrecto`);
      if ((h.match(/<h1[ >]/g) || []).length !== 1) err(`${ruta}: no tiene exactamente un H1`);
      if (!/og:title/.test(h)) err(`${ruta}: sin Open Graph`);
      const hl = Object.fromEntries([...h.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
      const esperadoEs = SITE + (lang === 'es' ? ruta : otra), esperadoEn = SITE + (lang === 'es' ? otra : ruta);
      if (hl['es-CO'] !== esperadoEs || hl['en-US'] !== esperadoEn || hl['x-default'] !== esperadoEs) err(`${ruta}: hreflang incorrecto ${JSON.stringify(hl)}`);
      const sm = lang === 'es' ? sitemapEs : sitemapEn;
      if (!sm.includes(`<loc>${SITE}${ruta}</loc>`)) err(`${ruta}: falta en el sitemap`);
      // JSON-LD
      const ld = [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { try { const j = JSON.parse(m[1]); return Array.isArray(j) ? j : [j]; } catch { err(`${ruta}: JSON-LD roto`); return []; } });
      const bc = ld.find((x) => x['@type'] === 'BreadcrumbList'), il = ld.find((x) => x['@type'] === 'CollectionPage')?.mainEntity;
      if (!bc || bc.itemListElement.length !== 3 || bc.itemListElement[1].item !== SITE + (lang === 'es' ? `/${cat}/` : `/en/${SLUG_EN[cat]}/`)) err(`${ruta}: migas de pan incorrectas`);
      if (!il || il.numberOfItems !== f.total) err(`${ruta}: ItemList incorrecto`);
      if (ld.some((x) => x['@type'] === 'Product')) err(`${ruta}: la subcategoría tiene schema Product (debería ser solo la ficha)`);
      // enlaces: hija → madre y madre → hija
      const hrefMadre = lang === 'es' ? `href="/${cat}/"` : `href="/en/${SLUG_EN[cat]}/"`;
      if (!h.includes(hrefMadre)) err(`${ruta}: no enlaza a su categoría madre`);
      if (!(lang === 'es' ? madreEs : madreEn).includes(`href="${ruta}"`)) err(`${ruta}: la categoría madre no la enlaza`);
      // unicidad
      (titulos.get(title) ?? titulos.set(title, []).get(title)).push(ruta);
      (descripciones.get(desc) ?? descripciones.set(desc, []).get(desc)).push(ruta);
      // productos listados = los esperados
      const enlaces = (h.match(/class="btn btn-small" href="[^"]+-\d+\/"/g) || []).length;
      if (enlaces !== f.total) err(`${ruta}: lista ${enlaces} productos, esperados ${f.total}`);
    }
  }
}
for (const [t, r] of titulos) if (r.length > 1) err(`title repetido (${t}): ${r.join(', ')}`);
for (const [d, r] of descripciones) if (r.length > 1) err(`description repetida: ${r.join(', ')}`);

// Ninguna ficha de producto debe haberse alterado: siguen todas en el sitemap
for (const [cat, lista] of Object.entries(productos)) for (const p of lista) {
  if (!sitemapEs.includes(`<loc>${SITE}/${cat}/${p.slug}-${p.id}/</loc>`)) err(`ficha ES ausente del sitemap: ${cat}/${p.slug}-${p.id}`);
}
console.log(`Subcategorías: ${Object.values(filtros).reduce((s, l) => s + l.length, 0)} · páginas revisadas (ES+EN): ${n}`);
if (errores.length) { console.error('\nERRORES (' + errores.length + '):\n' + errores.slice(0, 40).map((e) => ' - ' + e).join('\n')); process.exit(1); }
console.log('OK: todas las subcategorías cumplen SEO, hreflang, sitemap y enlazado.');
