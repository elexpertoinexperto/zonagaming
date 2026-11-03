// Auditoría de la carga de imágenes (loading eager/lazy y fetchpriority) sobre dist/ — compilar antes: npm run build.
//   node tools/auditar-carga-imagenes.mjs     → lista lo que falle y sale con código 1 si hay algo
// Regla (web.dev: «no hagas lazy lo que está en el primer pantallazo, sobre todo la imagen LCP»):
//   · listados de categoría, subcategorías y Black Friday: las 4 primeras tarjetas (primera fila de escritorio) eager, el resto lazy;
//   · ficha de producto: la foto principal eager + fetchpriority="high";
//   · Recomendador (ES y EN): las 5 primeras portadas eager, el resto lazy;
//   · «Más vendidos» de la portada (bajo el pliegue): todo lazy.
// Si cambian las columnas del listado, se ajusta PRIMERA_FILA en ProductCard.astro y el número de aquí.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('../', import.meta.url)), 'dist');
const PRIMERA_FILA = 4, PORTADAS_EAGER = 5;
const errores = [];
const falla = (m) => errores.push(m);
const carga = (tag) => tag.match(/\sloading="(\w+)"/)?.[1] ?? 'eager(por defecto)';

function* paginas(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'imagenes' && f !== '_astro') yield* paginas(p); }
    else if (f === 'index.html') yield p;
  }
}

let nListados = 0, nFichas = 0, nRecomendadores = 0;
for (const archivo of paginas(DIST)) {
  const ruta = '/' + relative(DIST, archivo).replace(/\\/g, '/').replace(/index\.html$/, '');
  const html = readFileSync(archivo, 'utf8');

  const tarjetas = (html.match(/<article class="product-card"[\s\S]*?<\/article>/g) ?? []).map((a) => carga(a.match(/<img\b[^>]*>/)?.[0] ?? ''));
  if (tarjetas.length) {
    if (ruta === '/' || ruta === '/en/') {
      tarjetas.forEach((c, i) => { if (c !== 'lazy') falla(`${ruta}: «Más vendidos» #${i + 1} debería ser lazy y es ${c}`); });
    } else {
      nListados++;
      tarjetas.forEach((c, i) => {
        const esperado = i < PRIMERA_FILA ? 'eager' : 'lazy';
        if (c !== esperado) falla(`${ruta}: tarjeta #${i + 1} debería ser ${esperado} y es ${c}`);
      });
    }
  }

  const ficha = html.match(/<img\b[^>]*class="producto-imagen"[^>]*>/)?.[0];
  if (ficha) {
    nFichas++;
    if (carga(ficha) === 'lazy') falla(`${ruta}: la foto principal de la ficha no puede ser lazy`);
    if (!/fetchpriority="high"/.test(ficha)) falla(`${ruta}: la foto principal de la ficha necesita fetchpriority="high"`);
  }

  if (/^\/(recomendador|en\/recommender)\/$/.test(ruta)) {
    nRecomendadores++;
    const portadas = (html.match(/<img\b[^>]*class="game-img"[^>]*>/g) ?? []).map(carga);
    if (!portadas.length) falla(`${ruta}: no se encontraron portadas de juegos`);
    portadas.forEach((c, i) => {
      const esperado = i < PORTADAS_EAGER ? 'eager' : 'lazy';
      if (c !== esperado) falla(`${ruta}: portada #${i + 1} debería ser ${esperado} y es ${c}`);
    });
  }
}

console.log(`Listados: ${nListados} · fichas: ${nFichas} · recomendadores: ${nRecomendadores}`);
if (!nListados || !nFichas || nRecomendadores !== 2) falla('no se encontraron los tipos de página esperados (¿falta compilar?)');
if (errores.length) {
  console.error(`\n${errores.length} problema(s):`);
  for (const e of errores.slice(0, 40)) console.error(' - ' + e);
  process.exit(1);
}
console.log('OK: lo que se ve al abrir la página carga eager y el resto lazy; la foto de la ficha lleva fetchpriority="high".');
