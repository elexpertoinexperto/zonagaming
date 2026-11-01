// Auditoría SEO: la keyword de la categoría madre tiene que salir en el H1 de TODAS sus subcategorías (ES y EN).
//   node tools/auditar-keyword-madre.mjs          → lista lo que falte y sale con código 1 si hay algo
// Por qué: la gente busca «tarjeta gráfica» / «graphics card», no «GPU» a secas; la subcategoría «16 GB» debe llamarse
// «16GB VRAM Graphics Card», no «16GB GPU». Si se añade una categoría o cambia su keyword madre, se edita MADRE aquí.
import { readFileSync } from 'node:fs';
import { construirFiltros } from '../src/lib/filtros.mjs';

const leer = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'));
const productos = leer('productos.json');
const seo = leer('seo-keywords.json');
const SLUG_EN = { 'tarjetas-graficas': 'graphics-cards', procesadores: 'processors', 'memoria-ram': 'ram-memory', ssd: 'ssd', 'fuentes-de-poder': 'power-supplies',
  'refrigeracion-liquida': 'liquid-cooling', 'refrigeracion-normal': 'air-cooling', 'gabinetes-gamer': 'gaming-cases', teclados: 'keyboards', mouse: 'gaming-mice',
  audifonos: 'headsets', monitores: 'gaming-monitors' };

// Keyword madre aceptada en el H1 de sus subcategorías (la que se ataca en la categoría principal)
export const MADRE = {
  'tarjetas-graficas': { es: /tarjetas? gr[aá]ficas?/i, en: /graphics? cards?/i },
  procesadores: { es: /procesador(es)?/i, en: /(cpu|processor)s?/i },
  'memoria-ram': { es: /\bram\b/i, en: /\bram\b/i },
  ssd: { es: /\bssd\b/i, en: /\bssd\b/i },
  'fuentes-de-poder': { es: /fuentes? de poder/i, en: /(power supply|power supplies|psu)/i },
  'refrigeracion-liquida': { es: /refrigeraci[oó]n l[ií]quida/i, en: /(liquid cool|water cool|aio)/i },
  'refrigeracion-normal': { es: /(refrigeraci[oó]n por aire|disipador)/i, en: /(cpu cooler|air cool)/i },
  'gabinetes-gamer': { es: /gabinetes?/i, en: /\bcases?\b/i },
  teclados: { es: /teclados?/i, en: /keyboards?/i },
  mouse: { es: /\bmouse\b/i, en: /(mouse|mice)/i },
  audifonos: { es: /aud[ií]fonos?/i, en: /headsets?/i },
  monitores: { es: /monitor(es)?/i, en: /monitors?/i },
};

export function recorre() {
  const filas = [];
  for (const [cat, lista] of Object.entries(construirFiltros(productos))) {
    for (const f of lista) {
      for (const lang of ['es', 'en']) {
        const url = lang === 'en' ? `/en/${SLUG_EN[cat]}/${f.slugEn}/` : `/${cat}/${f.slugEs}/`;
        const h1 = seo[url]?.h1;
        filas.push({ cat, lang, url, h1, def: !h1, etiqueta: lang === 'en' ? f.en : f.es, grupo: f.grupo });
      }
    }
  }
  return filas;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const malas = recorre().filter((x) => !x.def && !MADRE[x.cat][x.lang].test(x.h1));
  for (const m of malas) console.log(`${m.lang.toUpperCase()} ${m.url}  H1="${m.h1}"  (falta la keyword madre)`);
  console.log(malas.length ? `\n${malas.length} subcategorías sin la keyword madre en el H1` : 'OK: todas las subcategorías con H1 propio llevan la keyword madre');
  process.exit(malas.length ? 1 : 0);
}
