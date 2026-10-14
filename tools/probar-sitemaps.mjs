// Uso:  npm run build && node tools/probar-sitemaps.mjs
// Comprueba sobre dist/ que los sitemaps están completos y bien repartidos:
//  - sitemap.xml (índice) lista los 6 sitemaps: pages, product y blog, cada uno en es y en, y todos existen;
//  - TODA página construida (menos la 404) está en un sitemap, y ninguna URL aparece dos veces;
//  - cada URL está en el sitemap que le toca: el blog (/blog/…) en blog, las fichas de producto en product y
//    todo lo demás (inicio, categorías, subcategorías…) en pages;
//  - cada URL del sitemap existe como página y esa página trae en su <head> hreflang es / en-US / x-default hacia páginas reales;
//  - formato como eljoseoweb.com: cada <url> lleva solo <loc> y <lastmod> (ISO 8601 UTC con «Z»), y el lastmod de cada
//    sitemap del índice es la fecha más reciente de las URLs que contiene;
//  - canonical = URL y ninguna página en noindex.
import fs from 'node:fs';

const SITE = 'https://monckeygamer.com';
const errores = [];
const leer = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const SLUG_EN = { 'tarjetas-graficas': 'graphics-cards', procesadores: 'processors', 'memoria-ram': 'ram-memory', ssd: 'ssd', 'fuentes-de-poder': 'power-supplies', 'refrigeracion-liquida': 'liquid-cooling', 'refrigeracion-normal': 'air-cooling', 'gabinetes-gamer': 'gaming-cases', teclados: 'keyboards', mouse: 'gaming-mice', audifonos: 'headsets', monitores: 'gaming-monitors' };
// URLs de ficha de producto (ES y EN), para saber a qué sitemap pertenece cada una
const fichas = new Set();
for (const [cat, lista] of Object.entries(leer('src/data/productos.json'))) {
  for (const p of lista) {
    fichas.add(`${SITE}/${cat}/${p.slug}-${p.id}/`);
    fichas.add(`${SITE}/en/${SLUG_EN[cat]}/${p.slug}-${p.id}/`);
  }
}
const err = (m) => errores.push(m);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));

const paginas = new Map(); // url → html
for (const f of walk('dist').filter((f) => f.endsWith('index.html'))) {
  paginas.set(SITE + f.slice(4).replace('index.html', ''), fs.readFileSync(f, 'utf8'));
}

const indice = fs.readFileSync('dist/sitemap.xml', 'utf8');
const hijos = [...indice.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(SITE + '/', ''));
const esperados = ['pages', 'product', 'blog'].flatMap((t) => ['es', 'en'].map((l) => `sitemap-${t}-${l}.xml`));
for (const e of esperados) if (!hijos.includes(e)) err(`el índice no lista ${e}`);
if (hijos.length !== esperados.length) err(`el índice lista ${hijos.length} sitemaps, esperados ${esperados.length}`);

const enSitemaps = new Map(); // url → archivo
const urlsDe = {};
for (const h of esperados) {
  if (!fs.existsSync(`dist/${h}`)) { err(`no existe dist/${h}`); continue; }
  const xml = fs.readFileSync(`dist/${h}`, 'utf8');
  const bloques = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
  urlsDe[h] = bloques.length;
  const tipoMap = h.split('-')[1]; // pages | product | blog
  for (const b of bloques) {
    const loc = b.match(/<loc>([^<]+)<\/loc>/)[1];
    if (enSitemaps.has(loc)) err(`URL repetida (${enSitemaps.get(loc)} y ${h}): ${loc}`);
    enSitemaps.set(loc, h);
    if (!paginas.has(loc)) err(`${h}: la URL no existe como página → ${loc}`);
    const tipoUrl = /^\/(en\/)?blog\//.test(loc.replace(SITE, '')) ? 'blog' : fichas.has(loc) ? 'product' : 'pages';
    if (tipoUrl !== tipoMap) err(`${h}: URL en el sitemap equivocado (es de tipo ${tipoUrl}) → ${loc}`);
    const idioma = h.endsWith('-en.xml') ? 'en' : 'es';
    if (idioma === 'en' !== loc.replace(SITE, '').startsWith('/en')) err(`${h}: idioma equivocado → ${loc}`);
    const hl = Object.fromEntries([...(paginas.get(loc) ?? '').matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
    for (const k of ['es', 'en-US', 'x-default']) if (!hl[k]) err(`${h}: la página no trae hreflang ${k} → ${loc}`);
    for (const u of [hl['es'], hl['en-US']]) if (u && !paginas.has(u)) err(`${h}: hreflang a una página que no existe → ${u}`);
  }
}

// Formato del protocolo (sitemaps.org y documentación de Google)
for (const h of [...esperados, 'sitemap.xml']) {
  const ruta = `dist/${h}`;
  if (!fs.existsSync(ruta)) continue;
  const bytes = fs.statSync(ruta).size;
  const xml = fs.readFileSync(ruta, 'utf8');
  if (bytes > 50 * 1024 * 1024) err(`${h}: pesa más de 50 MB`);
  if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) err(`${h}: falta la declaración XML UTF-8 al principio`);
  if (xml.charCodeAt(0) === 0xfeff) err(`${h}: lleva BOM`);
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  if (h !== 'sitemap.xml' && locs.length > 50000) err(`${h}: más de 50.000 URLs`);
  for (const l of locs) {
    if (!l.startsWith(SITE + '/')) err(`${h}: URL no absoluta o de otro dominio → ${l}`);
    if (l.length > 2048) err(`${h}: URL de más de 2048 caracteres → ${l.slice(0, 80)}`);
    if (/[^!-~]/.test(l)) err(`${h}: URL con espacios o caracteres no ASCII sin codificar → ${l}`);
    if (/&(?!amp;|apos;|quot;|lt;|gt;)/.test(l)) err(`${h}: & sin escapar → ${l}`);
  }
  const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (h === 'sitemap.xml') {
    // lastmod de cada sitemap del índice = la fecha más reciente de las URLs de ese sitemap
    for (const b of xml.match(/<sitemap>[\s\S]*?<\/sitemap>/g) ?? []) {
      const hijo = b.match(/<loc>([^<]+)<\/loc>/)[1].replace(SITE + '/', '');
      const lm = (b.match(/<lastmod>([^<]+)<\/lastmod>/) ?? [])[1];
      if (!ISO.test(lm ?? '')) { err(`sitemap.xml: lastmod de ${hijo} ausente o sin formato ISO UTC con Z → ${lm}`); continue; }
      const fechas = [...fs.readFileSync(`dist/${hijo}`, 'utf8').matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]).sort();
      if (fechas.at(-1) !== lm) err(`sitemap.xml: lastmod de ${hijo} (${lm}) no es el de su URL más reciente (${fechas.at(-1)})`);
    }
    continue;
  }
  // cada <url> lleva solo loc y lastmod (sin priority, changefreq ni xhtml:link: Google ignora los dos primeros y el hreflang va en el HTML)
  for (const b of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const orden = [...b.matchAll(/<([a-z:]+)[ >\/]/g)].map((m) => m[1]).filter((t) => t !== 'url');
    if (orden.join() !== 'loc,lastmod') { err(`${h}: <url> debe llevar solo loc y lastmod, lleva: ${orden.join()} → ${b.match(/<loc>([^<]+)/)[1]}`); break; }
    if (!ISO.test(b.match(/<lastmod>([^<]+)<\/lastmod>/)[1])) err(`${h}: lastmod sin formato ISO 8601 UTC con Z → ${b.match(/<loc>([^<]+)/)[1]}`);
  }
}

for (const [url, html] of paginas) {
  if (url === SITE + '/404/') continue;
  if (!enSitemaps.has(url)) err(`página fuera de los sitemaps: ${url}`);
  const canon = (html.match(/rel="canonical" href="([^"]+)"/) ?? [])[1];
  if (canon && canon !== url) err(`canonical distinto de la URL: ${url} → ${canon}`);
  if (/name="robots" content="[^"]*noindex/.test(html)) err(`página en noindex: ${url}`);
}

console.log('URLs por sitemap:', JSON.stringify(urlsDe));
console.log(`Páginas construidas: ${paginas.size} · URLs en sitemaps: ${enSitemaps.size}`);
if (errores.length) { console.error(`\nERRORES (${errores.length}):\n` + errores.slice(0, 30).map((e) => ' - ' + e).join('\n')); process.exit(1); }
console.log('OK: todas las páginas están en su sitemap, sin repetidas ni rotas.');
