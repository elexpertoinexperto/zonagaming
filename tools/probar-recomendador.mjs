// Uso (desde la raíz):  node tools/probar-recomendador.mjs
// Comprueba que el motor de src/lib/rendimiento.mjs funciona con TODO el catálogo actual:
//  1. todo producto de GPU/CPU/RAM se puntúa (si no, el motor lanza un error claro);
//  2. cada juego recibe GPU + CPU + RAM, que existen en el catálogo (ES y EN);
//  3. la RAM recomendada es compatible con la plataforma del CPU recomendado;
//  4. cada ficha de producto de las 6 categorías con guía de juegos recibe al menos 1 juego;
//  5. las piezas complementarias de las fichas existen.
// Sale con código 1 si algo falla (sirve como prueba antes de subir cambios).
import fs from 'node:fs';
import {
  prepararCatalogo, recomendarParaJuego, juegosParaProducto, puntuarCpu, puntuarRam,
} from '../src/lib/rendimiento.mjs';

const leer = (f) => JSON.parse(fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8'));
const es = leer('src/data/productos.json');
const en = leer('src/data/productos-en.json');
const juegos = leer('src/data/juegos-index.json');
const errores = [];
const falla = (m) => errores.push(m);

const catalogo = prepararCatalogo(es);
const existe = (cat, id, slug) => es[cat]?.some((p) => p.id === id && p.slug === slug);
const existeEn = (cat, id, slug) => en[cat]?.some((p) => p.id === id && p.slug === slug);
const DDR_OK = { AM4: ['DDR4'], AM5: ['DDR5'], LGA1851: ['DDR5'], LGA1700: ['DDR4', 'DDR5'] };

const usados = { 'tarjetas-graficas': new Set(), procesadores: new Set(), 'memoria-ram': new Set() };
for (const j of juegos) {
  const recs = recomendarParaJuego(j, catalogo);
  const cats = recs.map((r) => r.categoria).sort().join();
  if (cats !== 'memoria-ram,procesadores,tarjetas-graficas') falla(`${j.titulo}: faltan categorías (${cats})`);
  for (const r of recs) {
    usados[r.categoria].add(r.id);
    if (!existe(r.categoria, r.id, r.slug)) falla(`${j.titulo}: ${r.categoria} #${r.id} no existe en ES`);
    if (!existeEn(r.categoria, r.id, r.slug)) falla(`${j.titulo}: ${r.categoria} #${r.id} no existe en EN`);
    for (const a of r.alternativas) if (!existe(a.categoria, a.id, a.slug)) falla(`${j.titulo}: alternativa ${a.nombre} no existe`);
    if (!r.razon || !r.razonEn) falla(`${j.titulo}: ${r.categoria} sin razón`);
  }
  const cpu = es.procesadores.find((p) => p.id === recs.find((r) => r.categoria === 'procesadores').id);
  const ram = es['memoria-ram'].find((p) => p.id === recs.find((r) => r.categoria === 'memoria-ram').id);
  if (!DDR_OK[puntuarCpu(cpu).plataforma].includes(puntuarRam(ram).tipo)) {
    falla(`${j.titulo}: RAM ${ram.nombre} no es compatible con ${cpu.nombre}`);
  }
}

const sinJuegos = [];
let totalFichas = 0;
for (const cat of ['tarjetas-graficas', 'procesadores', 'memoria-ram', 'ssd', 'refrigeracion-normal', 'refrigeracion-liquida']) {
  for (const p of es[cat]) {
    totalFichas++;
    const { juegos: js } = juegosParaProducto(cat, p, catalogo, juegos);
    if (!js.length) { sinJuegos.push(`${cat} #${p.id} ${p.nombre}`); continue; }
    for (const g of js) {
      if (!existe(g.recomendado.categoria, g.recomendado.id, g.recomendado.slug)) {
        falla(`ficha ${cat} #${p.id}: complemento ${g.recomendado.nombre} no existe`);
      }
    }
  }
}

console.log(`Juegos: ${juegos.length} · fichas revisadas: ${totalFichas}`);
console.log(`Productos distintos recomendados → GPU ${usados['tarjetas-graficas'].size}/30, CPU ${usados.procesadores.size}/30, RAM ${usados['memoria-ram'].size}/30`);
if (sinJuegos.length) console.log('Fichas SIN juegos (informativo):\n  ' + sinJuegos.join('\n  '));
if (errores.length) {
  console.error('\nERRORES:\n' + errores.map((e) => ' - ' + e).join('\n'));
  process.exit(1);
}
console.log('OK: el motor funciona con todo el catálogo.');
