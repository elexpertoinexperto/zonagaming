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

const baseUrl = new URL(import.meta.env.SITE || 'http://localhost:3000');

export const GET: APIRoute = () => {
  // URLs de categorías
  const categoryUrls = categories.map(cat => `  <url>
    <loc>${new URL(`/${cat}`, baseUrl).href}</loc>
    <priority>0.8</priority>
  </url>`).join('\n');

  // URLs de productos individuales
  const productUrls = categories.map(cat => {
    const categoryProducts = productos[cat as keyof typeof productos];
    return categoryProducts.map(product => `  <url>
    <loc>${new URL(`/${cat}/${product.slug}-${product.id}`, baseUrl).href}</loc>
    <priority>0.6</priority>
  </url>`).join('\n');
  }).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <priority>1.0</priority>
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
