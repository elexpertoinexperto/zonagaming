import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap de productos en español: solo las fichas de producto (con hreflang hacia la versión EN)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('es', 'product'), { headers: xmlHeaders });
};
