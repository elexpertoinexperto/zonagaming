// Lógica compartida de los sitemaps.
// /sitemap.xml (índice) → 6 sitemaps, cada uno en español e inglés:
//   sitemap-pages-es.xml · sitemap-pages-en.xml      inicio, recomendador, contacto, categorías y subcategorías
//   sitemap-product-es.xml · sitemap-product-en.xml  solo las fichas de producto
//   sitemap-blog-es.xml · sitemap-blog-en.xml        solo /blog/ y /en/blog/
import productos from '../data/productos.json';
import { toEnPath } from '../i18n/en';
import { FILTROS } from './filtros-catalogo';
import { statSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fileMtime(relativePath: string): string {
  try {
    const abs = resolve(__dirname, '../pages', relativePath);
    const mtime = statSync(abs).mtime;
    return mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Los artículos del blog se descubren solos: cada archivo de src/pages/blog/*.astro es un artículo.
// Si un artículo existe en español pero no en inglés (o al revés) el build lo avisa, porque el hreflang quedaría roto.
const slugsDe = (archivos: string[]) =>
  archivos.map((p) => p.split('/').pop()!.replace(/.astro$/, '')).filter((n) => n !== 'index').sort();
const blogEs = slugsDe(Object.keys(import.meta.glob('../pages/blog/*.astro')));
const blogEn = slugsDe(Object.keys(import.meta.glob('../pages/en/blog/*.astro')));
for (const slug of blogEs.filter((x) => !blogEn.includes(x))) console.warn(`[sitemap] el artículo "${slug}" no tiene versión en inglés`);
for (const slug of blogEn.filter((x) => !blogEs.includes(x))) console.warn(`[sitemap] el artículo "${slug}" solo existe en inglés`);
const blogSlugs = blogEs.filter((x) => blogEn.includes(x));

const categories = [
  'tarjetas-graficas',
  'procesadores',
  'memoria-ram',
  'ssd',
  'fuentes-de-poder',
  'refrigeracion-liquida',
  'refrigeracion-normal',
  'gabinetes-gamer',
  'teclados',
  'mouse',
  'audifonos',
  'monitores',
];

export const site = (import.meta.env.SITE || 'http://localhost:3000').replace(/\/$/, '');

export type TipoSitemap = 'pages' | 'product' | 'blog';
type Entry = { path: string; lastmod: string; priority: string; tipo: TipoSitemap };

// Todas las rutas del sitio expresadas en su forma española
function allEntries(): Entry[] {
  const entries: Entry[] = [
    { path: '/', lastmod: fileMtime('index.astro'), priority: '1.0', tipo: 'pages' },
    { path: '/recomendador/', lastmod: fileMtime('recomendador/index.astro'), priority: '0.8', tipo: 'pages' },
    { path: '/blog/', lastmod: fileMtime('blog.astro'), priority: '0.7', tipo: 'blog' },
    { path: '/contacto/', lastmod: fileMtime('contacto/index.astro'), priority: '0.5', tipo: 'pages' },
  ];

  for (const slug of blogSlugs) {
    entries.push({ path: `/blog/${slug}/`, lastmod: fileMtime(`blog/${slug}.astro`), priority: '0.6', tipo: 'blog' });
  }

  for (const cat of categories) {
    entries.push({ path: `/${cat}/`, lastmod: fileMtime(`${cat}/index.astro`), priority: '0.8', tipo: 'pages' });
    // Subcategorías (filtros) de la categoría: /categoria/para-1080p/ (prioridad entre la categoría y las fichas)
    for (const filtro of FILTROS[cat] ?? []) {
      entries.push({ path: `/${cat}/${filtro.slugEs}/`, lastmod: fileMtime(`${cat}/[filtro].astro`), priority: '0.7', tipo: 'pages' });
    }
    const categoryProducts = productos[cat as keyof typeof productos];
    for (const product of categoryProducts) {
      entries.push({
        path: `/${cat}/${product.slug}-${product.id}/`,
        lastmod: fileMtime(`${cat}/[id].astro`),
        priority: '0.6',
        tipo: 'product',
      });
    }
  }

  return entries;
}

// Genera el <urlset> de un idioma y un tipo (pages, product o blog). Cada entrada lleva sus hreflang recíprocos.
export function entradasDe(tipo: TipoSitemap): Entry[] {
  return allEntries().filter((e) => e.tipo === tipo);
}

// Fecha de la última modificación de un sitemap (la más reciente de sus URLs), para el índice
export function ultimaModificacion(tipo: TipoSitemap): string {
  return entradasDe(tipo).map((e) => e.lastmod).sort().pop() ?? new Date().toISOString().split('T')[0];
}

// Escapa los caracteres reservados de XML (& ' " < >) en las URLs, como exige el protocolo de sitemaps
const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Orden de los elementos de cada <url> según el esquema oficial (sitemaps.org/schemas/sitemap/0.9/sitemap.xsd):
// loc → lastmod → changefreq → priority → elementos de otros espacios de nombres (xhtml:link para hreflang).
// Cada URL lista TODAS sus versiones, incluida ella misma (requisito de Google para hreflang en sitemaps).
export function buildUrlset(lang: 'es' | 'en', tipo: TipoSitemap): string {
  const urls = entradasDe(tipo)
    .map((e) => {
      const esLoc = `${site}${e.path}`;
      const enLoc = `${site}${toEnPath(e.path)}`;
      const loc = lang === 'es' ? esLoc : enLoc;
      return `  <url>
    <loc>${xml(loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <priority>${e.priority}</priority>
    <xhtml:link rel="alternate" hreflang="es-CO" href="${xml(esLoc)}"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="${xml(enLoc)}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${xml(esLoc)}"/>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

export const xmlHeaders = { 'Content-Type': 'application/xml; charset=utf-8' };
