import type { APIRoute } from 'astro';
import productos from '../data/productos.json';

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
  const categoryUrls = categories.map(cat => `  <url>
    <loc>${site}/${cat}/</loc>
    <priority>0.8</priority>
  </url>`).join('\n');

  const productUrls = categories.map(cat => {
    const categoryProducts = productos[cat as keyof typeof productos];
    return categoryProducts.map(product => `  <url>
    <loc>${site}/${cat}/${product.slug}-${product.id}/</loc>
    <priority>0.6</priority>
  </url>`).join('\n');
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${site}</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${site}/blog</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${site}/blog/que-es-la-vram/</loc>
    <priority>0.6</priority>
  </url>
  ${categoryUrls}
  ${productUrls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
