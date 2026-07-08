import type { APIRoute } from 'astro';
import { site, xmlHeaders } from '../lib/sitemap-data';

// Índice de sitemaps: uno por idioma
export const GET: APIRoute = () => {
  const now = new Date().toISOString().split('T')[0];
  const index = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${site}/sitemap-es.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${site}/sitemap-en.xml</loc>
    <lastmod>${now}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(index, { headers: xmlHeaders });
};
