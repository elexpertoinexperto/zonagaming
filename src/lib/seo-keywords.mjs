// Optimización SEO por keyword de las páginas de categoría y subcategoría.
// Los datos salen de la investigación de palabras clave (src/data/seo-keywords.json): por cada URL, su keyword principal
// con volumen real (las de volumen ≤10 se descartaron), el H1 que la contiene y las secundarias/terciarias relevantes.
//   · Categorías (24): title, H1, meta description, introducción y bloque de texto escritos a mano en el JSON.
//   · Subcategorías: se construyen aquí con plantillas a partir de la keyword, así al añadir productos no hay nada que mantener.
// Una URL que no está en el JSON conserva su SEO de siempre.
import datos from '../data/seo-keywords.json';

const MARCA = 'Monckey Gamer';
const LIMITE_TITLE = 62;
// Categorías de «gamer»: el title añade el contexto gaming si el H1 no lo trae
const CON_GAMING = new Set(['teclados', 'mouse', 'audifonos', 'monitores', 'gabinetes-gamer']);

export const seoDe = (ruta) => datos[ruta] ?? null;

const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const lista = (items, lang) =>
  items.length === 1 ? items[0] : items.slice(0, -1).join(', ') + (lang === 'es' ? ' o ' : ' or ') + items[items.length - 1];

// «H1 + al mejor precio | Monckey Gamer», recortando lo que sobre para no pasar del límite
export function tituloPagina(h1, catKey, lang) {
  const gaming = CON_GAMING.has(catKey);
  const extra = !gaming ? '' : lang === 'es' ? (/gamer|gaming/i.test(h1) ? '' : ' Gamer') : (/gaming/i.test(h1) ? '' : ' for Gaming');
  const cola = lang === 'es' ? ' al Mejor Precio' : ' at the Best Price';
  for (const t of [h1 + extra + cola, h1 + extra, h1]) {
    const s = `${t} | ${MARCA}`;
    if (s.length <= LIMITE_TITLE) return s;
  }
  return `${h1} | ${MARCA}`;
}

export function descripcionSub({ h1, total, min, max, lang }) {
  const lo = Math.round(min), hi = Math.round(max);
  const sep = h1.includes(':') ? ' –' : ':';
  const larga = lang === 'es'
    ? `${h1}${sep} ${total} modelos desde $${lo} hasta $${hi} USD. Compara specs y precios y compra directo en Amazon con ${MARCA}.`
    : `${h1}${sep} ${total} models from $${lo} to $${hi} USD. Compare specs and prices and buy direct on Amazon with ${MARCA}.`;
  if (larga.length <= 158) return larga;
  return larga.replace(` con ${MARCA}`, '').replace(` with ${MARCA}`, '');
}

export function introSub({ kw, total, min, max, lang }) {
  return lang === 'es'
    ? `${mayus(kw)}: ${total} modelos en nuestro catálogo, con precios desde ${min} hasta ${max} USD y enlace directo a Amazon.`
    : `${mayus(kw)}: ${total} models in our catalog, priced from ${min} to ${max} USD, each with a direct Amazon link.`;
}

// Bloque de texto con las keywords secundarias y terciarias (solo las que tienen volumen y encajan con la página)
export function textoSub({ kw, sec, ter, total, min, max, lang, hrefCategoria, nombreCategoria }) {
  const v = hash(kw + lang) % 3;
  const lo = Math.round(min), hi = Math.round(max);
  const es = lang === 'es';
  const p1 = es
    ? [
        `Si estás buscando ${kw}, aquí encuentras ${total} opciones del catálogo de ${MARCA}, ordenadas de la más barata a la más cara y con enlace directo a Amazon.`,
        `Esta selección de ${kw} reúne ${total} productos con precio actualizado, desde $${lo} hasta $${hi} USD, para que compares especificaciones sin salir de la página.`,
        `¿Quieres comprar ${kw}? Estas son las ${total} opciones que tenemos, con sus especificaciones y el precio de cada una, listas para comprar en Amazon.`,
      ][v]
    : [
        `If you are looking for ${kw}, you will find ${total} options from the ${MARCA} catalog here, sorted from cheapest to most expensive and linked straight to Amazon.`,
        `This ${kw} selection gathers ${total} products with up-to-date prices, from $${lo} to $${hi} USD, so you can compare specs without leaving the page.`,
        `Want to buy ${kw}? These are the ${total} options we have, with the specs and price of each one, ready to buy on Amazon.`,
      ][v];
  const parrafos = [p1];
  if (sec.length) {
    const s = lista(sec, lang);
    parrafos.push(es
      ? [`Si tu búsqueda es ${s}, esta misma página te sirve: usa la lista de arriba y la guía rápida para decidir.`,
         `Quienes buscan ${s} suelen comparar precio, especificaciones y marca; tienes todo eso en el listado de arriba.`,
         `Esta página también responde a búsquedas como ${s}: compara los modelos y elige el que mejor encaje con tu presupuesto.`][v]
      : [`If your search is ${s}, this same page works for you: use the list above and the quick guide to decide.`,
         `Shoppers looking for ${s} usually compare price, specs and brand, and you will find all of that in the list above.`,
         `This page also answers searches such as ${s}: compare the models and pick the one that fits your budget.`][v]);
  }
  if (ter.length) {
    const t = lista(ter, lang);
    parrafos.push(es
      ? `Otras búsquedas habituales relacionadas son ${t}. Si no ves exactamente lo que buscas, <a href="${hrefCategoria}">explora todos los ${nombreCategoria}</a>.`
      : `Other common related searches are ${t}. If you do not see exactly what you want, <a href="${hrefCategoria}">browse all ${nombreCategoria}</a>.`);
  }
  return {
    h2: es ? `${mayus(kw)}: qué mirar antes de comprar` : `${mayus(kw)}: what to check before you buy`,
    parrafos,
  };
}
