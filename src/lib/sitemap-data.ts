// Lógica compartida de los sitemaps. Mismo formato que eljoseoweb.com: XML sin extras, solo <loc> y <lastmod> por URL,
// con la fecha real de modificación en ISO 8601 UTC («Z»). El hreflang vive en el <head> de cada página (SiteLayout).
// /sitemap.xml (índice) → 6 sitemaps, cada uno en español e inglés:
//   sitemap-pages-es.xml · sitemap-pages-en.xml      inicio, recomendador, contacto, categorías y subcategorías
//   sitemap-product-es.xml · sitemap-product-en.xml  solo las fichas de producto
//   sitemap-blog-es.xml · sitemap-blog-en.xml        solo /blog/ y /en/blog/
//
// Las fechas salen de src/data/sitemap-lastmod.json, que mantiene tools/actualizar-lastmod.mjs (hook de git + prebuild):
// una URL cambia de fecha solo cuando cambia de verdad lo que muestra su página. Ver src/lib/sitemap-entradas.mjs.
import { toEnPath } from '../i18n/en';
import { listarEntradas } from './sitemap-entradas.mjs';
import lastmods from '../data/sitemap-lastmod.json';

export const site = (import.meta.env.SITE || 'http://localhost:3000').replace(/\/$/, '');

export type TipoSitemap = 'pages' | 'product' | 'blog';
export type Idioma = 'es' | 'en';
type Entry = { path: string; tipo: TipoSitemap };

const entradas: Entry[] = listarEntradas();
const manifiesto = lastmods as Record<string, Partial<Record<Idioma, { h: string; m: string }>>>;

// Fecha de modificación de una URL en un idioma. Si falta en el manifiesto (build sin pasar por `npm run build`),
// se omite en lugar de inventarla: una fecha falsa es peor que ninguna.
const fechaDe = (path: string, lang: Idioma): string | undefined => {
  const m = manifiesto[path]?.[lang]?.m;
  if (!m) console.warn(`[sitemap] sin lastmod para ${lang.toUpperCase()} ${path}: ejecuta  node tools/actualizar-lastmod.mjs`);
  return m;
};

export function entradasDe(tipo: TipoSitemap): Entry[] {
  return entradas.filter((e) => e.tipo === tipo);
}

// Fecha más reciente de un conjunto de fechas ISO (todas en UTC con «Z», así que se ordenan como texto)
const masReciente = (fechas: (string | undefined)[]) => fechas.filter(Boolean).sort().pop();

// lastmod de un sitemap = el de su URL modificada más recientemente. Si una URL cambia, sube su sitemap y sube el índice.
export function ultimaModificacion(tipo: TipoSitemap, lang: Idioma): string | undefined {
  return masReciente(entradasDe(tipo).map((e) => fechaDe(e.path, lang)));
}

// Escapa los caracteres reservados de XML (& ' " < >) en las URLs, como exige el protocolo de sitemaps
const xml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/'/g, '&apos;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const lastmodXml = (f?: string) => (f ? `<lastmod>${f}</lastmod>` : '');

export function buildUrlset(lang: Idioma, tipo: TipoSitemap): string {
  const urls = entradasDe(tipo)
    .map((e) => `<url><loc>${xml(site + (lang === 'es' ? e.path : toEnPath(e.path)))}</loc>${lastmodXml(fechaDe(e.path, lang))}</url>`)
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export function buildIndex(): string {
  const hijos = (['pages', 'product', 'blog'] as const).flatMap((tipo) =>
    (['es', 'en'] as const).map((lang) => `<sitemap><loc>${site}/sitemap-${tipo}-${lang}.xml</loc>${lastmodXml(ultimaModificacion(tipo, lang))}</sitemap>`)
  );
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${hijos.join('')}</sitemapindex>`;
}

export const xmlHeaders = { 'Content-Type': 'application/xml; charset=utf-8' };
