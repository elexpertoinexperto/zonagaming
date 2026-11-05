// Auditoría del idioma de TODAS las páginas generadas (sobre dist/, compilar antes: npm run build).
//   node tools/auditar-idioma.mjs     → lista lo que falle y sale con código 1 si hay algo
// Regla: español = es (genérico, toda Latinoamérica), inglés = en-US (Estados Unidos), igual en <html lang>, hreflang, og:locale y el inLanguage del JSON-LD.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('../', import.meta.url)), 'dist');
const errores = [];
function* paginas(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { if (f !== 'imagenes' && f !== '_astro') yield* paginas(p); }
    else if (f.endsWith('.html')) yield p;
  }
}
let n = 0;
for (const archivo of paginas(DIST)) {
  n++;
  const ruta = '/' + relative(DIST, archivo).split(sep).join('/');
  const html = readFileSync(archivo, 'utf8');
  const en = ruta.startsWith('/en/');
  const [lang, locale] = en ? ['en-US', 'en_US'] : ['es', 'es_LA'];
  const htmlLang = html.match(/<html[^>]*\slang="([^"]*)"/)?.[1];
  if (htmlLang !== lang) errores.push(`${ruta}: <html lang="${htmlLang}"> debería ser «${lang}»`);
  const og = html.match(/<meta property="og:locale" content="([^"]*)"/)?.[1];
  if (og && og !== locale) errores.push(`${ruta}: og:locale «${og}» debería ser «${locale}»`);
  for (const m of html.matchAll(/"inLanguage":\s*"([^"]*)"/g)) if (m[1] !== lang) errores.push(`${ruta}: inLanguage «${m[1]}» debería ser «${lang}»`);
  for (const m of html.matchAll(/hreflang="([^"]*)"/g)) if (!['es', 'en-US', 'x-default'].includes(m[1])) errores.push(`${ruta}: hreflang «${m[1]}» no es es / en-US / x-default`);
}
console.log(`Páginas revisadas: ${n}`);
if (errores.length) { console.error(`${errores.length} problema(s):`); errores.slice(0, 30).forEach((e) => console.error(' - ' + e)); process.exit(1); }
console.log('OK: español = es e inglés = en-US en <html lang>, og:locale, hreflang e inLanguage de todas las páginas.');
