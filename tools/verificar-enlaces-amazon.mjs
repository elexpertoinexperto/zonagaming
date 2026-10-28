// Comprueba que cada enlace corto de Amazon (amzn.to/…) apunta al mismo producto (ASIN) que dice su ficha.
//   node tools/verificar-enlaces-amazon.mjs
// Solo lee la redirección del enlace corto (cabeceras, 1 petición por enlace y pausa de 0,6 s): NO abre ni raspa páginas de Amazon.
// Los enlaces directos amazon.com/dp/ASIN ya se comprueban sin red en tools/auditar-catalogo.mjs.
import { readFileSync } from 'node:fs';

const es = JSON.parse(readFileSync(new URL('../src/data/productos.json', import.meta.url), 'utf8'));
const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
let total = 0, mal = 0;

for (const [cat, lista] of Object.entries(es)) {
  for (const p of lista) {
    if (!p.enlaceAmazon.includes('amzn.to')) continue;
    total++;
    let loc = '';
    try {
      const r = await fetch(p.enlaceAmazon, { method: 'HEAD', redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } });
      loc = r.headers.get('location') ?? '';
    } catch (e) { loc = `ERROR ${e.message}`; }
    const asin = /\/(?:dp|gp\/product)\/([A-Z0-9]{10})/.exec(loc)?.[1];
    if (asin !== p.asin) { mal++; console.log(`✖ ${cat} #${p.id} ${p.nombre.slice(0, 50)}: ficha ${p.asin} · enlace ${asin ?? '(sin ASIN)'} · ${loc.slice(0, 90)}`); }
    await pausa(600);
  }
}
console.log(mal ? `✖ ${mal} de ${total} enlaces cortos no coinciden con su ficha` : `OK: los ${total} enlaces cortos apuntan al ASIN de su ficha`);
process.exit(mal ? 1 : 0);
