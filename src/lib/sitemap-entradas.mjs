// Lista de TODAS las URLs que van a los sitemaps y de qué depende el contenido de cada una (en español y en inglés).
// Lo usan dos sitios, para que nunca se desincronicen:
//   - src/lib/sitemap-data.ts           → arma los sitemaps al compilar (lee las fechas de src/data/sitemap-lastmod.json)
//   - tools/actualizar-lastmod.mjs      → calcula la huella de cada URL y, si cambió, le pone la fecha de hoy
// Es .mjs puro (sin TypeScript ni import.meta.glob) para que Node lo pueda ejecutar directamente desde el hook de git.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { construirFiltros, NOMBRES } from './filtros.mjs';
import { analizar } from './analisis.mjs';

// Todo cuelga de la raíz del proyecto; tanto `astro build` como el hook se ejecutan desde ahí.
const RAIZ = process.cwd();
const ruta = (rel) => resolve(RAIZ, rel);

export const CATEGORIAS = [
  'tarjetas-graficas', 'procesadores', 'memoria-ram', 'ssd', 'fuentes-de-poder', 'refrigeracion-liquida',
  'refrigeracion-normal', 'gabinetes-gamer', 'teclados', 'mouse', 'audifonos', 'monitores',
];

const cacheTexto = new Map();
// Texto de un archivo con los saltos de línea normalizados: en Windows (CRLF) y en el build de Cloudflare (LF) la huella sale igual.
const texto = (rel) => {
  if (!cacheTexto.has(rel)) {
    cacheTexto.set(rel, existsSync(ruta(rel)) ? readFileSync(ruta(rel), 'utf8').replace(/\r\n/g, '\n') : '');
  }
  return cacheTexto.get(rel);
};
const json = (rel) => JSON.parse(texto(rel));

const PRODUCTOS = { es: 'src/data/productos.json', en: 'src/data/productos-en.json' };
const productos = { es: json(PRODUCTOS.es), en: json(PRODUCTOS.en) };

// Un «insumo» es un trozo de contenido del que depende la página: { fuente (archivo del repo), contenido (texto que se hashea) }
const archivo = (rel) => ({ fuente: rel, contenido: texto(rel) });
const datos = (fuente, valor) => ({ fuente, contenido: JSON.stringify(valor) });

// Slug EN de cada categoría: se lee de src/i18n/en.ts (SLUG_EN) para no duplicarlo
const SLUG_EN = Object.fromEntries(
  [...(texto('src/i18n/en.ts').match(/SLUG_EN[^{]*\{([\s\S]*?)\n\};/)?.[1] ?? '').matchAll(/'([^']+)':\s*'([^']+)'/g)].map((m) => [m[1], m[2]])
);
for (const cat of CATEGORIAS) {
  if (!SLUG_EN[cat]) throw new Error(`[sitemap] falta el slug en inglés de "${cat}" en SLUG_EN (src/i18n/en.ts)`);
}

const FILTROS = construirFiltros(productos.es);

// Contenido propio de cada URL que NO sale del registro del producto: SEO por keyword, errores comunes y categorías relacionadas.
const SEO_KW = json('src/data/seo-keywords.json');
const bloque = (rel, cat) => {
  // líneas de un archivo .ts de datos que pertenecen a UNA categoría (desde «  'cat': [» hasta «  ],»): cambiar una categoría no mueve las demás
  const lineas = texto(rel).split('\n');
  const salida = [];
  for (let k = 0; k < lineas.length; k++) {
    if (lineas[k] === `  '${cat}': [` || lineas[k] === `  ${cat}: [`) {
      while (k < lineas.length && lineas[k] !== '  ],') salida.push(lineas[k++]);
    }
  }
  return salida.join('\n');
};
const datosCat = (cat) => [
  datos('src/data/relaciones.ts', bloque('src/data/relaciones.ts', cat)),
  datos('src/data/errores-comunes.ts', bloque('src/data/errores-comunes.ts', cat)),
];

// Los artículos del blog se descubren solos: cada archivo de src/pages/blog/*.astro es un artículo.
// Si existe en un idioma pero no en el otro el build lo avisa, porque el hreflang quedaría roto.
const slugsDe = (dir) =>
  (existsSync(ruta(dir)) ? readdirSync(ruta(dir)) : [])
    .filter((n) => n.endsWith('.astro')).map((n) => n.replace(/\.astro$/, '')).filter((n) => n !== 'index').sort();
const blogEs = slugsDe('src/pages/blog');
const blogEn = slugsDe('src/pages/en/blog');
for (const s of blogEs.filter((x) => !blogEn.includes(x))) console.warn(`[sitemap] el artículo "${s}" no tiene versión en inglés`);
for (const s of blogEn.filter((x) => !blogEs.includes(x))) console.warn(`[sitemap] el artículo "${s}" solo existe en inglés`);
const blogSlugs = blogEs.filter((x) => blogEn.includes(x));

const EN_TS = 'src/i18n/en.ts';
const FAQ = 'src/data/faq.ts';

// Cada entrada: { path (forma española), tipo, insumos: { es: () => Insumo[], en: () => Insumo[] } }
// «insumos» es perezoso: el build de Astro solo necesita las rutas; las huellas solo las pide el hook.
export function listarEntradas() {
  const entradas = [];
  const add = (path, tipo, es, en) => entradas.push({ path, tipo, insumos: { es, en } });

  add('/', 'pages',
    () => [archivo('src/pages/index.astro'), ...['tarjetas-graficas', 'procesadores', 'memoria-ram'].map((c) => datos(PRODUCTOS.es, productos.es[c]))],
    () => [archivo('src/pages/en/index.astro'), archivo(EN_TS), ...['tarjetas-graficas', 'procesadores', 'memoria-ram'].map((c) => datos(PRODUCTOS.en, productos.en[c]))]);

  // El recomendador cambia con los juegos, con los productos (precios incluidos) y con sus reglas de puntuación
  const reco = () => [archivo('src/data/juegos-index.json'), archivo(PRODUCTOS.es), archivo('src/lib/rendimiento.mjs')];
  add('/recomendador/', 'pages', () => [archivo('src/pages/recomendador/index.astro'), ...reco()], () => [archivo('src/pages/en/recommender/index.astro'), ...reco()]);

  add('/blog/', 'blog', () => [archivo('src/pages/blog.astro'), archivo('src/data/blog-es.ts')], () => [archivo('src/pages/en/blog/index.astro'), archivo(EN_TS)]);
  add('/contacto/', 'pages', () => [archivo('src/pages/contacto/index.astro')], () => [archivo('src/pages/en/contacto/index.astro')]);

  for (const slug of blogSlugs) {
    add(`/blog/${slug}/`, 'blog', () => [archivo(`src/pages/blog/${slug}.astro`)], () => [archivo(`src/pages/en/blog/${slug}.astro`)]);
  }

  for (const cat of CATEGORIAS) {
    const catEn = SLUG_EN[cat];
    add(`/${cat}/`, 'pages',
      () => [archivo(`src/pages/${cat}/index.astro`), archivo(FAQ), datos('src/data/seo-keywords.json', SEO_KW[`/${cat}/`] ?? null), ...datosCat(cat), datos(PRODUCTOS.es, productos.es[cat])],
      () => [archivo(`src/pages/en/${catEn}/index.astro`), archivo(FAQ), archivo(EN_TS), datos('src/data/seo-keywords.json', SEO_KW[`/en/${catEn}/`] ?? null), ...datosCat(cat), datos(PRODUCTOS.en, productos.en[cat])]);

    // Subcategorías (filtros): cambian si cambia su definición (textos, rango de precios, productos) o los productos que contienen
    for (const f of FILTROS[cat] ?? []) {
      const lista = (lang) => f.ids.map((id) => productos[lang][cat].find((p) => p.id === id)).filter(Boolean);
      const seoEs = SEO_KW[`/${cat}/${f.slugEs}/`] ?? null;
      const seoEn = SEO_KW[`/en/${catEn}/${f.slugEn}/`] ?? null;
      add(`/${cat}/${f.slugEs}/`, 'pages',
        () => [datos('src/lib/filtros.mjs', f), datos('src/data/seo-keywords.json', seoEs), ...datosCat(cat), datos(PRODUCTOS.es, lista('es'))],
        () => [datos('src/lib/filtros.mjs', f), datos('src/data/seo-keywords.json', seoEn), ...datosCat(cat), datos(PRODUCTOS.en, lista('en'))]);
    }

    // Fichas de producto: cambian cuando cambia SU registro (precio, ficha, enlace, imagen…) en ese idioma, su archivo de página
    // o su ANÁLISIS (veredicto, posición por precio, comparación con el vecino más barato y más caro: depende de la categoría entera)
    const analisis = (lang, p) => {
      const lista = productos[lang][cat];
      const q = lista.find((x) => x.id === p.id);
      return q ? analizar(cat, q, lista, lang, lang === 'en' ? `/en/${catEn}` : `/${cat}`, NOMBRES[cat][lang], productos.es[cat]) : null;
    };
    for (const p of productos.es[cat]) {
      add(`/${cat}/${p.slug}-${p.id}/`, 'product',
        () => [archivo(`src/pages/${cat}/[id].astro`), datos(PRODUCTOS.es, p), datos('src/lib/analisis.mjs', analisis('es', p))],
        () => [archivo(`src/pages/en/${catEn}/[id].astro`), datos(PRODUCTOS.en, productos.en[cat].find((q) => q.id === p.id) ?? null), datos('src/lib/analisis.mjs', analisis('en', p))]);
    }
  }
  return entradas;
}
