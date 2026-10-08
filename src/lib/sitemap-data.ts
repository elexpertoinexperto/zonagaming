// Lógica compartida de los sitemaps.
// /sitemap.xml (índice) → 4 sitemaps:
//   sitemap-es.xml · sitemap-en.xml            (todo menos el blog)
//   sitemap-blog-es.xml · sitemap-blog-en.xml  (solo /blog/ y /en/blog/)
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

export type TipoSitemap = 'general' | 'blog';
type Entry = { path: string; lastmod: string; priority: string };

// Todo lo que cuelga de /blog/ va al sitemap del blog
const esBlog = (path: string) => path === '/blog/' || path.startsWith('/blog/');

// Todas las rutas del sitio expresadas en su forma española
function allEntries(): Entry[] {
  const entries: Entry[] = [
    { path: '/', lastmod: fileMtime('index.astro'), priority: '1.0' },
    { path: '/recomendador/', lastmod: fileMtime('recomendador/index.astro'), priority: '0.8' },
    { path: '/blog/', lastmod: fileMtime('blog.astro'), priority: '0.7' },
    { path: '/contacto/', lastmod: fileMtime('contacto/index.astro'), priority: '0.5' },
  ];

  for (const slug of blogSlugs) {
    entries.push({ path: `/blog/${slug}/`, lastmod: fileMtime(`blog/${slug}.astro`), priority: '0.6' });
  }

  for (const cat of categories) {
    entries.push({ path: `/${cat}/`, lastmod: fileMtime(`${cat}/index.astro`), priority: '0.8' });
    // Subcategorías (filtros) de la categoría: /categoria/para-1080p/ (prioridad entre la categoría y las fichas)
    for (const filtro of FILTROS[cat] ?? []) {
      entries.push({ path: `/${cat}/${filtro.slugEs}/`, lastmod: fileMtime(`${cat}/[filtro].astro`), priority: '0.7' });
    }
    const categoryProducts = productos[cat as keyof typeof productos];
    for (const product of categoryProducts) {
      entries.push({
        path: `/${cat}/${product.slug}-${product.id}/`,
        lastmod: fileMtime(`${cat}/[id].astro`),
        priority: '0.6',
      });
    }
  }

  return entries;
}

// Genera el <urlset> de un idioma y un tipo (general o blog). Cada entrada lleva sus hreflang recíprocos.
export function entradasDe(tipo: TipoSitemap): Entry[] {
  return allEntries().filter((e) => (tipo === 'blog') === esBlog(e.path));
}

// Fecha de la última modificación de un sitemap (la más reciente de sus URLs), para el índice
export function ultimaModificacion(tipo: TipoSitemap): string {
  return entradasDe(tipo).map((e) => e.lastmod).sort().pop() ?? new Date().toISOString().split('T')[0];
}

export function buildUrlset(lang: 'es' | 'en', tipo: TipoSitemap = 'general'): string {
  const urls = entradasDe(tipo)
    .map((e) => {
      const esLoc = `${site}${e.path}`;
      const enLoc = `${site}${toEnPath(e.path)}`;
      const loc = lang === 'es' ? esLoc : enLoc;
      return `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="es-CO" href="${esLoc}" type="application/xhtml+xml"/>
    <xhtml:link rel="alternate" hreflang="en-US" href="${enLoc}" type="application/xhtml+xml"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${esLoc}" type="application/xhtml+xml"/>
    <lastmod>${e.lastmod}</lastmod>
    <priority>${e.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
}

export const xmlHeaders = { 'Content-Type': 'application/xml' };
