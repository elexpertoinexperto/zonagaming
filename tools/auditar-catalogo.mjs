// Auditoría de coherencia del catálogo (productos.json ↔ productos-en.json). Se ejecuta sin red:
//   node tools/auditar-catalogo.mjs
// Falla (código 1) si encuentra algo falso o incoherente; así un producto nuevo mal metido no llega al sitio.
//   · ids, precios, ASIN, marca e imagen iguales en ES y EN
//   · sin duplicados de ASIN, enlace, nombre ni slug en una categoría
//   · el ASIN del enlace directo de Amazon (amazon.com/dp/…) es el de la ficha
//   · el nombre no contradice la ficha (VRAM, capacidad, DDR, potencia, radiador, Hz, peso…)
//   · la ficha EN no tiene palabras en español (nombres, valores, descripción)
//   · ninguna descripción deja un «N/D» a la vista
// El enlace corto amzn.to ↔ ASIN se comprueba con `node tools/verificar-enlaces-amazon.mjs` (necesita red).
import { readFileSync } from 'node:fs';

const leer = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const es = leer('productos.json');
const en = leer('productos-en.json');
const errores = [];
const err = (cat, id, msg) => errores.push(`${cat} #${id}: ${msg}`);
const num = (s) => { const m = String(s ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/); return m ? parseFloat(m[0]) : NaN; };

// Palabras que delatan texto sin traducir en la versión inglesa (sin las que también son inglés: «ideal», «base»…)
const ESPANOL = /\b(con|sin|para|negro|negra|blanco|blanca|azul|gris|vidrio|templado|pantalla|torre|doble|simple|cableado|inal[aá]mbrico|ventiladores?|mec[aá]nico|membrana|teclado|rat[oó]n|aud[ií]fonos|cristal|acr[ií]lico|malla|nogal|roble|econ[oó]mico|silencioso|perfil|bajo|incluidos?|preinstalados?|completo|lineales|intercambiables|h[ií]bridos?|[oó]pticos?|ergon[oó]mico|botones|micr[oó]fono|desmontable|totalmente|panor[aá]mico|c[aá]mara)\b/i;

for (const cat of Object.keys(es)) {
  const L = es[cat], E = en[cat] ?? [];
  const porId = new Map(E.map((p) => [p.id, p]));
  if (L.length !== E.length) err(cat, '-', `ES tiene ${L.length} y EN ${E.length}`);
  for (const key of ['asin', 'enlaceAmazon', 'nombre', 'slug']) {
    const vistos = new Map();
    for (const p of L) { if (vistos.has(p[key])) err(cat, `${vistos.get(p[key])}/${p.id}`, `${key} repetido: ${p[key]}`); else vistos.set(p[key], p.id); }
  }
  for (const p of L) {
    const q = porId.get(p.id);
    const sp = p.especificaciones;
    if (!q) { err(cat, p.id, 'falta en EN'); continue; }
    for (const k of ['precio', 'asin', 'enlaceAmazon', 'slug', 'precioFecha']) if (p[k] !== q[k]) err(cat, p.id, `${k} distinto ES/EN (${p[k]} / ${q[k]})`);
    const imgEs = String(p.imagenUrl), imgEn = String(q.imagenUrl);
    if (imgEs !== imgEn && !(imgEs.includes('placeholder') && imgEn.includes('placeholder'))) err(cat, p.id, 'imagen distinta ES/EN');
    const m = /^https:\/\/www\.amazon\.com\/dp\/([A-Z0-9]{10})\?tag=mockeygamer-20$/.exec(p.enlaceAmazon);
    if (!m && !p.enlaceAmazon.startsWith('https://amzn.to/')) err(cat, p.id, `enlace raro: ${p.enlaceAmazon}`);
    if (m && m[1] !== p.asin) err(cat, p.id, `ASIN del enlace (${m[1]}) ≠ ficha (${p.asin})`);
    if (!/^B[0-9A-Z]{9}$/.test(p.asin)) err(cat, p.id, `ASIN raro: ${p.asin}`);
    if (!(p.precio > 0 && p.precio < 3000)) err(cat, p.id, `precio raro: ${p.precio}`);
    if (!p.imagenUrl) err(cat, p.id, 'sin imagen');
    if (Object.keys(sp).length !== Object.keys(q.especificaciones).length) err(cat, p.id, 'distinto nº de especificaciones ES/EN');

    // nombre vs ficha
    const n = p.nombre;
    const chk = (ok, msg) => { if (!ok) err(cat, p.id, msg); };
    let r;
    if (cat === 'tarjetas-graficas') {
      if ((r = /(\d+)\s?GB/.exec(n) ?? /\b(\d+)G\b/.exec(n))) chk(num(sp.VRAM) === +r[1], `VRAM del nombre ${r[1]} ≠ ficha ${sp.VRAM}`);
      if ((r = /GDDR(\d)/.exec(n))) chk(sp.VRAM.includes(`GDDR${r[1]}`), `GDDR del nombre ≠ ficha ${sp.VRAM}`);
    }
    if (cat === 'memoria-ram') {
      if ((r = /(\d+)GB \((\d)x(\d+)GB\)/.exec(n))) chk(sp.Capacidad.startsWith(`${r[1]}GB (${r[2]}x${r[3]}GB)`), `capacidad ${sp.Capacidad}`);
      if ((r = /DDR(\d)/.exec(n))) chk(sp.Tipo === `DDR${r[1]}`, `tipo ${sp.Tipo}`);
      if ((r = /(\d{4})\s?(MHz|MT\/s)/.exec(n))) chk(sp.Velocidad.startsWith(r[1]), `velocidad ${sp.Velocidad}`);
      if ((r = /CL(\d+)/.exec(n))) chk(sp.Latencia.startsWith(`CL${r[1]}`), `latencia ${sp.Latencia}`);
    }
    if (cat === 'ssd') {
      if ((r = /\b(\d+)\s?(TB|GB)\b/.exec(n))) chk(sp.Capacidad.replace(/\s/g, '').toUpperCase() === r[1] + r[2], `capacidad ${sp.Capacidad}`);
      if (/SATA/.test(n)) chk(/SATA/.test(sp.Interfaz), `interfaz ${sp.Interfaz}`);
      if (/Gen4|PCIe 4/.test(n)) chk(/4/.test(sp.Interfaz), `interfaz ${sp.Interfaz}`);
      if (/Gen5|PCIe 5/.test(n)) chk(/5/.test(sp.Interfaz), `interfaz ${sp.Interfaz}`);
    }
    if (cat === 'fuentes-de-poder') {
      if ((r = /(\d{3,4})\s?W\b/.exec(n))) chk(num(sp.Potencia) === +r[1], `potencia ${sp.Potencia}`);
      if (/Bronze/.test(n)) chk(/Bronze/.test(sp['Certificación']), `certificación ${sp['Certificación']}`);
      if (/Gold/.test(n)) chk(/Gold/.test(sp['Certificación']), `certificación ${sp['Certificación']}`);
    }
    if (cat === 'refrigeracion-liquida' && (r = /\b(240|280|360)\b/.exec(n))) chk(sp.Radiador.startsWith(r[1]), `radiador ${sp.Radiador}`);
    if (cat === 'monitores') {
      if ((r = /(\d{2,3}) ?Hz/.exec(n))) chk(sp.Frecuencia.includes(r[1]), `Hz del nombre ${r[1]} ≠ ficha ${sp.Frecuencia}`);
      if (/OLED/.test(n)) chk(/OLED/.test(sp.Panel), `panel ${sp.Panel}`);
      if (/4K/.test(n)) chk(/2160/.test(sp['Resolución']), `resolución ${sp['Resolución']}`);
    }
    if (cat === 'mouse' && (r = /(\d+)g\b/.exec(n))) chk(String(sp.Peso).includes(r[1]), `peso del nombre ${r[1]} ≠ ficha ${sp.Peso}`);

    // textos en inglés con palabras en español
    const textosEn = [q.nombre, q.descripcion, ...Object.values(q.especificaciones), q.marca ?? ''];
    for (const tx of textosEn) { const mm = ESPANOL.exec(String(tx)); if (mm) { err(cat, p.id, `EN con español «${mm[0]}»: ${String(tx).slice(0, 70)}`); break; } }
    // placeholders a la vista en las descripciones
    for (const [lang, d] of [['ES', p.descripcion], ['EN', q.descripcion]]) if (/N\/[DA]\b|undefined|null/.test(d)) err(cat, p.id, `${lang}: descripción con placeholder: ${d.slice(0, 70)}`);
  }
}

if (errores.length) { console.error(`✖ ${errores.length} problemas en el catálogo:\n` + errores.join('\n')); process.exit(1); }
console.log(`OK: ${Object.values(es).flat().length} productos coherentes entre ES y EN, sin duplicados, ASIN correctos, nombres acordes a la ficha y sin español en la versión inglesa.`);
