import type { APIRoute } from 'astro';

const categories = [
  '/tarjetas-graficas',
  '/procesadores',
  '/memoria-ram',
  '/ssd',
  '/fuentes-de-poder',
  '/refrigeracion-liquida',
  '/refrigeracion-normal',
  '/gabinetes-gamer',
  '/teclados',
  '/mouse',
  '/audifonos',
];

const baseUrl = new URL(import.meta.env.SITE || 'http://localhost:3000');

export const GET: APIRoute = () => {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <priority>1.0</priority>
  </url>
  ${categories.map(cat => `  <url>
    <loc>${baseUrl}${cat}</loc>
    <priority>0.8</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};
