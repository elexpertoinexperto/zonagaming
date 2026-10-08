import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap de la versión en español, sin el blog (con hreflang hacia la versión EN)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('es', 'general'), { headers: xmlHeaders });
};
