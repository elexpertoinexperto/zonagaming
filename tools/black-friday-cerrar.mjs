#!/usr/bin/env node
// Cierra la campaña TEMPORAL de Black Friday (src/data/black-friday.mjs): hay que hacerlo a FINALES DE NOVIEMBRE (hasta: 2026-11-30).
//   node tools/black-friday-cerrar.mjs            muestra qué haría (no cambia nada)
//   node tools/black-friday-cerrar.mjs --aplicar  lo hace:
//     1. pone `activo: false` en src/data/black-friday.mjs  → salen de los sitemaps y desaparece el enlace «Black Friday» de los filtros
//     2. borra las páginas  src/pages/black-friday/  y  src/pages/en/black-friday/  (y sus componentes)
//     3. añade a public/_redirects las redirecciones 301:  /black-friday/<cat>/ → /<cat>/   ·   /en/black-friday/<cat-en>/ → /en/<cat-en>/
//        y los portales  /black-friday/ → /  ·  /en/black-friday/ → /en/   (cambia REDIRECCION_* aquí abajo si quieres otro destino)
// Después: `npm run build`, revisar que /black-friday/ ya no existe en dist/ y subir el commit.
import { readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const aplicar = process.argv.includes('--aplicar');
const { CATEGORIAS_BF } = await import('../src/data/black-friday.mjs');

const REDIRECCION_HUB_ES = '/';
const REDIRECCION_HUB_EN = '/en/';

const en = readFileSync('src/i18n/en.ts', 'utf8');
const SLUG_EN = Object.fromEntries([...(en.match(/SLUG_EN[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? '').matchAll(/'([^']+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]]));

const reglas = [
  `/black-friday/ ${REDIRECCION_HUB_ES} 301`,
  `/en/black-friday/ ${REDIRECCION_HUB_EN} 301`,
  ...CATEGORIAS_BF.flatMap((c) => [`/black-friday/${c}/ /${c}/ 301`, `/en/black-friday/${SLUG_EN[c]}/ /en/${SLUG_EN[c]}/ 301`]),
];
const actual = existsSync('public/_redirects') ? readFileSync('public/_redirects', 'utf8') : '';
const nuevas = reglas.filter((r) => !actual.includes(r));

console.log(`Redirecciones 301 a añadir (${nuevas.length}):\n  ${nuevas.join('\n  ')}`);
const borrar = ['src/pages/black-friday', 'src/pages/en/black-friday', 'src/components/BlackFridayCategoria.astro', 'src/components/BlackFridayHub.astro'].filter(existsSync);
console.log(`\nSe borrarán: ${borrar.join(', ') || '(nada, ya estaban borrados)'}`);
console.log('Se pondrá activo: false en src/data/black-friday.mjs');
if (!aplicar) { console.log('\n(simulación: usa --aplicar para hacerlo de verdad)'); process.exit(0); }

const cfg = readFileSync('src/data/black-friday.mjs', 'utf8').replace(/activo: true,/, 'activo: false,');
writeFileSync('src/data/black-friday.mjs', cfg);
for (const r of borrar) rmSync(r, { recursive: true, force: true });
if (nuevas.length) writeFileSync('public/_redirects', actual.replace(/\s*$/, '\n') + '\n# Black Friday terminó: cada página temporal va a su categoría permanente\n' + nuevas.join('\n') + '\n');
console.log('\nListo. Ahora: npm run build · comprobar dist/ · commit y push.');
