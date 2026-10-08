import type { APIRoute } from 'astro';
import { site, ultimaModificacion, xmlHeaders } from '../lib/sitemap-data';

// Índice de sitemaps: páginas, productos y blog, cada uno en español e inglés
export const GET: APIRoute = () => {
  const hijos = (['pages', 'product', 'blog'] as const).flatMap((tipo) =>
    (['es', 'en'] as const).map((lang) => [`sitemap-${tipo}-${lang}.xml`, ultimaModificacion(tipo)] as const)
  );
  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${hijos.map(([archivo, fecha]) => `  <sitemap>
    <loc>${site}/${archivo}</loc>
    <lastmod>${fecha}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(index, { headers: xmlHeaders });
};
