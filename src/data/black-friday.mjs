// Campaña TEMPORAL de Black Friday: una página por categoría principal (ES y EN) con los productos del más barato al más caro.
//   ES  /black-friday/                     ·  /black-friday/tarjetas-graficas/   …
//   EN  /en/black-friday/                  ·  /en/black-friday/graphics-cards/   …
//
// ⚠ Es TEMPORAL: dura hasta finales de noviembre. Al terminar, `node tools/black-friday-cerrar.mjs` apaga la campaña
// (quita las páginas y los sitemaps) y deja las redirecciones 301 en public/_redirects. Mientras tanto, para
// cambiar fechas o a dónde se redirige, se edita SOLO este archivo.
//
// Nota sobre los precios: el catálogo no guarda precios de antes, así que las páginas NO afirman descuentos ni «% menos»:
// ordenan por precio actual del catálogo y le dicen al visitante que confirme el precio final en Amazon.

export const BLACK_FRIDAY = {
  activo: true,                        // false = no se generan las páginas ni entran en los sitemaps (lo cambia tools/black-friday-cerrar.mjs)
  anio: 2026,
  viernes: '2026-11-27',               // Black Friday 2026 (el viernes tras Thanksgiving, jueves 26)
  cyberMonday: '2026-11-30',
  hasta: '2026-11-30',                 // último día con las páginas vivas
  redireccionHub: '/',                 // a dónde va /black-friday/ al cerrar (en inglés: /en/)
  // Al cerrar, cada /black-friday/<cat>/ redirige a su categoría permanente (/<cat>/) — el mismo tema, así no se pierde lo ganado
};

export const CATEGORIAS_BF = [
  'tarjetas-graficas', 'procesadores', 'memoria-ram', 'ssd', 'fuentes-de-poder', 'refrigeracion-liquida',
  'refrigeracion-normal', 'gabinetes-gamer', 'teclados', 'mouse', 'audifonos', 'monitores',
];

// Fechas en texto, para las páginas
const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MESES_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const fechaTexto = (iso, lang, conAnio = false) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (lang === 'en') return conAnio ? `${MESES_EN[m - 1]} ${d}, ${y}` : `${MESES_EN[m - 1]} ${d}`;
  return conAnio ? `${d} de ${MESES_ES[m - 1]} de ${y}` : `${d} de ${MESES_ES[m - 1]}`;
};

// «Tarjetas gráficas» → «Tarjetas Gráficas» (como los demás H1 del sitio); las palabras cortas (de, por, y…) se quedan en minúscula
const CORTAS = new Set(['de', 'del', 'la', 'el', 'y', 'o', 'por', 'para', 'and', 'for', 'of']);
export const tituloCaso = (txt) => txt.split(' ').map((w, i) => (i > 0 && CORTAS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
