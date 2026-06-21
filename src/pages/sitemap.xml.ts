import type { APIRoute } from 'astro';
import productos from '../data/productos.json';
import { statSync } from 'fs';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

function fileMtime(relativePath: string): string {
  try {
    const abs = resolve(__dirname, relativePath);
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

const site = (import.meta.env.SITE || 'http://localhost:3000').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const blogUrls = blogSlugs.map(slug => {
    const lastmod = fileMtime(`blog/${slug}.astro`);
    return `  <url>
    <loc>${site}/blog/${slug}/</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.6</priority>
  </url>`;
  }).join('\n');

  const categoryUrls = categories.map(cat => {
    const lastmod = fileMtime(`${cat}/index.astro`);
    return `  <url>
    <loc>${site}/${cat}/</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.8</priority>
  </url>`;
  }).join('\n');

  const productUrls = categories.map(cat => {
    const categoryProducts = productos[cat as keyof typeof productos];
    return categoryProducts.map(product => {
      const lastmod = fileMtime(`${cat}/[id].astro`);
      return `  <url>
    <loc>${site}/${cat}/${product.slug}-${product.id}/</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>0.6</priority>
  </url>`;
    }).join('\n');
  }).join('\n');

  const indexLastmod = fileMtime('index.astro');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}/</loc>
    <lastmod>${indexLastmod}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site}/blog/</loc>
    <lastmod>${fileMtime('blog.astro')}</lastmod>
    <priority>0.7</priority>
  </url>
  ${blogUrls}
  ${categoryUrls}
  ${productUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
