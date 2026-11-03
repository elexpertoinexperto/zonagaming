// Alt-text de las imágenes de producto: la keyword principal de la categoría (la del H1) + el nombre del producto.
// Nunca «Imagen de…» / «Image of…»: eso no aporta nada a quien busca ni a Google. Ejemplo:
//   «Tarjeta gráfica para PC ASUS Prime Radeon RX 9070 XT 16GB GDDR6 OC Edition»
// La clave es la de la categoría en productos.json (en ES y en EN); la keyword sale del H1 de cada categoría.
const KW = {
  es: {
    'tarjetas-graficas': 'Tarjeta gráfica para PC',
    procesadores: 'Procesador para PC',
    'memoria-ram': 'Memoria RAM gamer',
    ssd: 'Disco duro sólido SSD',
    'fuentes-de-poder': 'Fuente de poder para PC',
    'refrigeracion-liquida': 'Refrigeración líquida para PC',
    'refrigeracion-normal': 'Disipador de calor de PC',
    'gabinetes-gamer': 'Gabinete PC gamer',
    teclados: 'Teclado gamer',
    mouse: 'Mouse gamer',
    audifonos: 'Audífonos gamer',
    monitores: 'Monitor gamer',
  },
  en: {
    'tarjetas-graficas': 'Graphics card (GPU)',
    procesadores: 'CPU processor',
    'memoria-ram': 'Gaming RAM memory',
    ssd: 'SSD solid state drive',
    'fuentes-de-poder': 'PC power supply (PSU)',
    'refrigeracion-liquida': 'Water cooling AIO CPU cooler',
    'refrigeracion-normal': 'CPU cooler',
    'gabinetes-gamer': 'Gaming PC case',
    teclados: 'Gaming keyboard',
    mouse: 'Gaming mouse',
    audifonos: 'Gaming headset',
    monitores: 'Gaming monitor',
  },
};

// Slug de la URL en inglés → clave de categoría (mismo mapa que SLUG_EN de src/i18n/en.ts; tools/auditar-alt.mjs comprueba que no se desfasen)
export const SLUG_EN_A_CLAVE = {
  'graphics-cards': 'tarjetas-graficas',
  processors: 'procesadores',
  'ram-memory': 'memoria-ram',
  ssd: 'ssd',
  'power-supplies': 'fuentes-de-poder',
  'liquid-cooling': 'refrigeracion-liquida',
  'air-cooling': 'refrigeracion-normal',
  'gaming-cases': 'gabinetes-gamer',
  keyboards: 'teclados',
  'gaming-mice': 'mouse',
  headsets: 'audifonos',
  'gaming-monitors': 'monitores',
};

const plegar = (s) => String(s).normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

// '/en/graphics-cards/asus-x-1/' o '/tarjetas-graficas/asus-x-1/' → 'tarjetas-graficas' (null si la ruta no es de una categoría)
export function claveDeRuta(ruta) {
  const seg = String(ruta || '').replace(/^\/en\//, '/').split('/').filter(Boolean)[0];
  if (!seg) return null;
  const clave = SLUG_EN_A_CLAVE[seg] ?? seg;
  return KW.es[clave] ? clave : null;
}

export const keywordAlt = (clave, lang = 'es') => KW[lang]?.[clave] ?? null;

// Si el nombre ya empieza por la keyword («Fuente de poder Corsair…») no se repite
export function altProducto(clave, nombre, lang = 'es') {
  const kw = keywordAlt(clave, lang);
  if (!kw) return nombre;
  return plegar(nombre).startsWith(plegar(kw).split(' ')[0]) ? nombre : `${kw} ${nombre}`;
}

// Portada de un juego en el recomendador y en las fichas
export const altJuego = (titulo, lang = 'es') =>
  lang === 'en' ? `${titulo}: recommended PC components` : `${titulo}: componentes de PC recomendados`;
