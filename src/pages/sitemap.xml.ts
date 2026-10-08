import type { APIRoute } from 'astro';
import { site, ultimaModificacion, xmlHeaders } from '../lib/sitemap-data';

// Índice de sitemaps: sitio y blog, cada uno en español e inglés
export const GET: APIRoute = () => {
  const general = ultimaModificacion('general');
  const blog = ultimaModificacion('blog');
  const hijos = [
    ['sitemap-es.xml', general],
    ['sitemap-en.xml', general],
    ['sitemap-blog-es.xml', blog],
    ['sitemap-blog-en.xml', blog],
  ];
  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${hijos.map(([archivo, fecha]) => `  <sitemap>
    <loc>${site}/${archivo}</loc>
    <lastmod>${fecha}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(index, { headers: xmlHeaders });
};
