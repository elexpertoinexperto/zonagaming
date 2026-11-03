// Auditoría de alt-text de las imágenes (sobre dist/, hay que compilar antes: npm run build).
//   node tools/auditar-alt.mjs          → lista lo que falle y sale con código 1 si hay algo
// Regla (src/lib/alt-texto.mjs): el alt de un producto = keyword principal de su categoría (la del H1) + nombre del producto,
// y nunca «Imagen de…» / «Image of…». Comprueba, en TODAS las páginas generadas (ES y EN):
//   1. ningún alt empieza por «Imagen de/Image of»;
//   2. toda <img> con contenido tiene alt (solo las decorativas llevan alt="");
//   3. cada foto de producto (tarjetas de listados, filtros, Black Friday y ficha) lleva exactamente el alt esperado;
//   4. el mapa de slugs en inglés de alt-texto.mjs coincide con SLUG_EN de src/i18n/en.ts.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { altProducto, claveDeRuta, SLUG_EN_A_CLAVE } from '../src/lib/alt-texto.mjs';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const DIST = join(RAIZ, 'dist');
const errores = [];
const falla = (m) => errores.push(m);

// 4. mapa de slugs
const en = readFileSync(join(RAIZ, 'src/i18n/en.ts'), 'utf8');
const bloque = en.match(/export const SLUG_EN[^{]*\{([\s\S]*?)\};/)?.[1] ?? '';
const slugEn = Object.fromEntries([...bloque.matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)].map((m) => [m[2], m[1]]));
for (const [slug, clave] of Object.entries(SLUG_EN_A_CLAVE)) {
  if (slugEn[slug] !== clave) falla(`alt-texto.mjs: «${slug}» debería apuntar a «${slugEn[slug]}» (SLUG_EN de src/i18n/en.ts)`);
}

const decodifica = (s) => s.replace(/&#34;|&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const atributo = (tag, nombre) => {
  const m = tag.match(new RegExp(`\\s${nombre}=("([^"]*)"|'([^']*)'|([^\\s>]+))`));
  return m ? decodifica(m[2] ?? m[3] ?? m[4]) : null;
};

function* paginas(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'imagenes' && f !== '_astro') yield* paginas(p); }
    else if (f === 'index.html') yield p;
  }
}

let nPag = 0, nProd = 0, nImg = 0;
for (const archivo of paginas(DIST)) {
  nPag++;
  const ruta = '/' + relative(DIST, archivo).replace(/\\/g, '/').replace(/index\.html$/, '');
  const html = readFileSync(archivo, 'utf8');

  for (const tag of html.match(/<img\b[^>]*>/g) ?? []) {
    nImg++;
    const alt = atributo(tag, 'alt');
    if (alt === null) { falla(`${ruta}: <img> sin alt → ${tag.slice(0, 90)}`); continue; }
    if (/^(imagen|image)\s+(de|of)\b/i.test(alt.trim())) falla(`${ruta}: alt con «imagen de/image of» → «${alt}»`);
  }

  // Tarjetas de producto (listados, filtros, Black Friday, más vendidos): <h2>nombre</h2> … <img alt> … enlace «Detalles» a la ficha
  for (const art of html.match(/<article class="product-card"[\s\S]*?<\/article>/g) ?? []) {
    const nombre = decodifica((art.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim());
    const alt = atributo(art.match(/<img\b[^>]*>/)?.[0] ?? '', 'alt');
    const href = art.match(/<a\b[^>]*class="btn btn-small"[^>]*href="([^"]+)"/)?.[1] ?? art.match(/<a\b[^>]*href="([^"]+)"[^>]*class="btn btn-small"/)?.[1] ?? '';
    if (!nombre || alt === null || !href) { falla(`${ruta}: tarjeta de producto ilegible (${nombre || 'sin nombre'})`); continue; }
    nProd++;
    const esperado = altProducto(claveDeRuta(href), nombre, href.startsWith('/en/') ? 'en' : 'es');
    if (alt !== esperado) falla(`${ruta}: alt de tarjeta «${alt}» ≠ «${esperado}»`);
  }

  // Ficha de producto
  const foto = html.match(/<img\b[^>]*class="producto-imagen"[^>]*>/)?.[0];
  if (foto) {
    nProd++;
    const nombre = decodifica((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? '').replace(/<[^>]+>/g, '').trim());
    const esperado = altProducto(claveDeRuta(ruta), nombre, ruta.startsWith('/en/') ? 'en' : 'es');
    if (atributo(foto, 'alt') !== esperado) falla(`${ruta}: alt de ficha «${atributo(foto, 'alt')}» ≠ «${esperado}»`);
  }
}

console.log(`Páginas: ${nPag} · imágenes: ${nImg} · fotos de producto revisadas: ${nProd}`);
if (errores.length) {
  console.error(`\n${errores.length} problema(s):`);
  for (const e of errores.slice(0, 40)) console.error(' - ' + e);
  if (errores.length > 40) console.error(` … y ${errores.length - 40} más`);
  process.exit(1);
}
console.log('OK: ningún alt dice «imagen de», todas las imágenes tienen alt y las fotos de producto llevan keyword + nombre.');
