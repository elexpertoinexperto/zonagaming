// Lógica compartida de los sitemaps por idioma.
// /sitemap.xml (índice) → /sitemap-es.xml + /sitemap-en.xml
import productos from '../data/productos.json';
import { toEnPath } from '../i18n/en';
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

const blogSlugs = [
  'que-es-la-vram',
  'que-es-el-ancho-de-bus-en-una-tarjeta-grafica',
  'que-es-la-velocidad-bus-en-tarjeta-grafica',
  'nucleos-e-hilos-en-un-procesador',
  'que-es-el-ddr-en-memoria-ram',
  'que-hace-la-latencia-en-ram',
  'como-instalar-una-refrigeracion-liquida',
  'como-saber-si-refrigeracion-liquida-es-silenciosa',
  'refrigeracion-liquida-vs-cooler-de-aire',
  'que-tener-en-cuenta-para-comprar-gabinete-gamer',
  'tipos-de-teclado-gamer',
  'teclado-gamer-cable-o-inalambrico',
  'que-switches-suenan-menos-teclado-gamer',
  'que-switches-son-mas-satisfactorios-para-escribir',
  'por-que-importa-el-peso-del-mouse-gamer',
  'mouse-gamer-inalambrico-tiene-lag',
  'tipos-de-agarre-para-mouse-gamer',
  'que-debe-tener-un-audifono-gamer-para-ser-comodo',
  'beneficios-audifono-gamer-inalambrico',
];

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
];

export const site = (import.meta.env.SITE || 'http://localhost:3000').replace(/\/$/, '');

type Entry = { path: string; lastmod: string; priority: string };

// Todas las rutas del sitio expresadas en su forma española
function allEntries(): Entry[] {
  const entries: Entry[] = [
    { path: '/', lastmod: fileMtime('index.astro'), priority: '1.0' },
    { path: '/blog/', lastmod: fileMtime('blog.astro'), priority: '0.7' },
    { path: '/contacto/', lastmod: fileMtime('contacto/index.astro'), priority: '0.5' },
  ];

  for (const slug of blogSlugs) {
    entries.push({ path: `/blog/${slug}/`, lastmod: fileMtime(`blog/${slug}.astro`), priority: '0.6' });
  }

  for (const cat of categories) {
    entries.push({ path: `/${cat}/`, lastmod: fileMtime(`${cat}/index.astro`), priority: '0.8' });
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

// Genera el <urlset> de un idioma. Cada entrada lleva sus hreflang recíprocos.
export function buildUrlset(lang: 'es' | 'en'): string {
  const urls = allEntries()
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
