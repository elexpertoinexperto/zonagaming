import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap de productos en inglés: solo las fichas de producto (con hreflang hacia la versión ES)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('en', 'product'), { headers: xmlHeaders });
};
