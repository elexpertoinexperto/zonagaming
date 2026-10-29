#!/usr/bin/env node
// Mantiene src/data/sitemap-lastmod.json: la fecha REAL de última modificación (<lastmod>) de cada URL de los sitemaps.
//
// Cómo funciona (equivalente al hook de «updatedDate» de eljoseoweb.com, pero para un sitio con catálogo en JSON):
//   - De cada URL se calcula una huella (SHA-256) de lo que muestra su página: su archivo .astro y/o su registro de
//     producto / sus productos, en cada idioma por separado (ver src/lib/sitemap-entradas.mjs).
//   - Si la huella es distinta a la guardada → el contenido cambió → lastmod = ahora (UTC, formato ISO con «Z»).
//   - Si es igual → se conserva la fecha anterior. Una URL nueva recibe la fecha de ahora. Una URL que ya no existe se borra.
//   - El índice (sitemap.xml) toma como lastmod la fecha más reciente de las URLs que contiene, así que se actualiza solo.
//
// Uso (desde la raíz del proyecto):
//   node tools/actualizar-lastmod.mjs              actualiza el manifiesto
//   node tools/actualizar-lastmod.mjs --git-add    igual, y deja el manifiesto en el commit (lo usa el hook pre-commit)
//   node tools/actualizar-lastmod.mjs --check      no escribe nada; sale con error si el manifiesto está desactualizado
//   node tools/actualizar-lastmod.mjs --sembrar    para URLs sin fecha usa el último commit de git de sus archivos
//                                                  (solo para la primera vez; después las nuevas reciben «ahora»)
//   node tools/actualizar-lastmod.mjs --adoptar    guarda las huellas nuevas SIN tocar las fechas (cuando cambia qué cuenta como contenido)
//   node tools/actualizar-lastmod.mjs --todo       fuerza «ahora» en TODAS las URLs (rediseño total del sitio)
// Se ejecuta solo antes de cada `npm run build` (script «prebuild») y en cada commit (hook: `npm run hooks:install`).
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const MANIFIESTO = 'src/data/sitemap-lastmod.json';
const args = new Set(process.argv.slice(2));
const { listarEntradas } = await import('../src/lib/sitemap-entradas.mjs');

const huella = (insumos) => {
  const h = createHash('sha256');
  for (const i of insumos) h.update(i.contenido).update('\u0000');
  return h.digest('hex').slice(0, 16);
};

const cacheCommit = new Map();
const commitDe = (f) => {
  if (!cacheCommit.has(f)) {
    let t = 0;
    try { t = Date.parse(execFileSync('git', ['log', '-1', '--format=%cI', '--', f], { encoding: 'utf8' }).trim()) || 0; } catch { /* sin git: se usa «ahora» */ }
    cacheCommit.set(f, t);
  }
  return cacheCommit.get(f);
};
const ultimoCommit = (fuentes) => {
  let max = 0;
  for (const f of new Set(fuentes)) max = Math.max(max, commitDe(f));
  return max ? new Date(max).toISOString() : null;
};

const previo = existsSync(MANIFIESTO) ? JSON.parse(readFileSync(MANIFIESTO, 'utf8')) : {};
const ahora = new Date().toISOString();
const nuevo = {};
const resumen = { nuevas: 0, modificadas: 0, iguales: 0, sembradas: 0, adoptadas: 0 };
const ejemplos = [];

for (const e of listarEntradas()) {
  nuevo[e.path] = {};
  for (const lang of ['es', 'en']) {
    const insumos = e.insumos[lang]();
    const h = huella(insumos);
    const antes = previo[e.path]?.[lang];
    let lastmod;
    if (args.has('--todo')) { lastmod = ahora; resumen.modificadas++; }
    else if (!antes) {
      lastmod = (args.has('--sembrar') && ultimoCommit(insumos.map((i) => i.fuente))) || ahora;
      resumen[args.has('--sembrar') ? 'sembradas' : 'nuevas']++;
    } else if (antes.h !== h && args.has('--adoptar')) {
      lastmod = antes.m; resumen.adoptadas++; // huella nueva SIN mover la fecha (al cambiar qué cuenta como contenido de una URL)
    } else if (antes.h !== h) {
      lastmod = ahora; resumen.modificadas++;
      if (ejemplos.length < 8) ejemplos.push(`${lang.toUpperCase()} ${e.path}`);
    } else { lastmod = antes.m; resumen.iguales++; }
    nuevo[e.path][lang] = { h, m: lastmod };
  }
}
const eliminadas = Object.keys(previo).filter((p) => !p.startsWith('_') && !(p in nuevo)).length;

// ── Red de seguridad por CONTENIDO RENDERIZADO (--render) ─────────────────────────────────────────────────────────────
// La huella de arriba solo conoce las fuentes que se le declararon. Esta compila el sitio y compara lo que MUESTRA cada página
// (sin cabecera, pie ni scripts; ver tools/huella-render.mjs) con lo que mostraba la última vez: si cambió y su fecha no se movió,
// se mueve. Así ningún cambio visible puede quedar sin lastmod, aunque nadie declarara de qué dependía esa página.
// --render-base: guarda las huellas actuales SIN mover fechas (primera vez o tras una corrección manual de fechas).
const RENDER = 'src/data/sitemap-render.json';
let renderMovidas = 0;
if (args.has('--render')) {
  const { huellasDeDist } = await import('./huella-render.mjs');
  if (!args.has('--sin-compilar')) {
    console.log('[lastmod] compilando para comparar el contenido renderizado…');
    execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build'], { stdio: 'pipe', maxBuffer: 1e9 });
  }
  const ahoraRender = huellasDeDist('dist');
  const guardadas = existsSync(RENDER) ? JSON.parse(readFileSync(RENDER, 'utf8')) : {};
  // ruta renderizada → (clave del manifiesto, idioma): los sitemaps de dist listan las URLs en el mismo orden que las entradas
  const entradas = listarEntradas();
  const mapa = new Map();
  for (const tipo of ['pages', 'product', 'blog']) {
    const es = entradas.filter((e) => e.tipo === tipo);
    for (const lang of ['es', 'en']) {
      const xml = readFileSync(`dist/sitemap-${tipo}-${lang}.xml`, 'utf8');
      const locs = [...xml.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1]);
      if (locs.length !== es.length) throw new Error(`[lastmod] sitemap-${tipo}-${lang}.xml tiene ${locs.length} URLs y el manifiesto ${es.length}`);
      locs.forEach((ruta, k) => mapa.set(ruta, { key: es[k].path, lang }));
    }
  }
  const nuevasGuardadas = {};
  for (const [ruta, { key, lang }] of mapa) {
    const r = ahoraRender[ruta];
    if (!r) throw new Error(`[lastmod] ${ruta} está en el sitemap pero no se construyó`);
    nuevasGuardadas[ruta] = r;
    if (args.has('--render-base') || !guardadas[ruta] || guardadas[ruta] === r) continue;
    const fila = nuevo[key][lang];
    if (fila.m !== previo[key]?.[lang]?.m || fila.h !== previo[key]?.[lang]?.h) continue; // ya se movió por su huella
    fila.m = ahora; renderMovidas++;
    if (ejemplos.length < 12) ejemplos.push(`${lang.toUpperCase()} ${key}  (por contenido renderizado)`);
  }
  const salidaR = '{\n' + Object.entries(nuevasGuardadas).map(([p, v]) => `  ${JSON.stringify(p)}: ${JSON.stringify(v)}`).join(',\n') + '\n}\n';
  if (salidaR !== (existsSync(RENDER) ? readFileSync(RENDER, 'utf8').replace(/\r\n/g, '\n') : '')) {
    if (!args.has('--check')) {
      writeFileSync(RENDER, salidaR, 'utf8');
      if (args.has('--git-add')) { try { execFileSync('git', ['add', RENDER]); } catch { /* fuera de git */ } }
    }
  }
}

// ── Fecha de cada ARCHIVO sitemap (la que lleva el índice) ────────────────────────────────────────────────────────────
// Protocolo y Google: el <lastmod> de un sitemap en el índice es «la fecha en que se modificó ESE archivo sitemap». Un sitemap cambia cuando
// se añade o quita una URL o cambia la fecha de cualquiera: por eso se guarda una huella de su lista (URL + fecha) y, si cambia, el archivo
// y su entrada del índice se fechan «ahora». (Tomar solo la fecha más reciente de sus URLs fallaba al QUITAR una URL.)
const hijos = {};
for (const tipo of ['pages', 'product', 'blog']) for (const lang of ['es', 'en']) {
  const filas = listarEntradas().filter((e) => e.tipo === tipo).map((e) => `${e.path}|${nuevo[e.path][lang].m}`);
  const h = createHash('sha256').update(filas.join('\n')).digest('hex').slice(0, 16);
  const clave = `${tipo}-${lang}`;
  const antes = previo._sitemaps?.[clave];
  const maxUrl = filas.map((f) => f.split('|')[1]).sort().pop();
  hijos[clave] = { h, m: !antes ? maxUrl : antes.h === h ? antes.m : (args.has('--adoptar') ? antes.m : ahora) };
}
nuevo._sitemaps = hijos;

// Una línea por URL: el diff de git queda legible
const salida = '{\n' + Object.entries(nuevo).map(([p, v]) => `  ${JSON.stringify(p)}: ${JSON.stringify(v)}`).join(',\n') + '\n}\n';
const cambio = salida !== (existsSync(MANIFIESTO) ? readFileSync(MANIFIESTO, 'utf8').replace(/\r\n/g, '\n') : '');

console.log(`[lastmod] ${resumen.iguales} sin cambios · ${resumen.modificadas} modificadas · ${renderMovidas} por contenido renderizado · ${resumen.nuevas + resumen.sembradas} nuevas · ${eliminadas} eliminadas`);
for (const x of ejemplos) console.log(`[lastmod]   modificada: ${x}`);

if (args.has('--check')) {
  if (cambio) { console.error('[lastmod] El manifiesto está desactualizado: ejecuta  node tools/actualizar-lastmod.mjs'); process.exit(1); }
  process.exit(0);
}
if (cambio) {
  writeFileSync(MANIFIESTO, salida, 'utf8');
  if (args.has('--git-add')) {
    try { execFileSync('git', ['add', MANIFIESTO]); } catch { /* fuera de git */ }
  }
}
