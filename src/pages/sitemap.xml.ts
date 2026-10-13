import type { APIRoute } from 'astro';
import { buildIndex, xmlHeaders } from '../lib/sitemap-data';

// Índice de sitemaps: páginas, productos y blog, cada uno en español e inglés.
// El lastmod de cada sitemap hijo es el de su URL modificada más recientemente (ver sitemap-data.ts).
export const GET: APIRoute = () => new Response(buildIndex(), { headers: xmlHeaders });
