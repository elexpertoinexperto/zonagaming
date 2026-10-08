import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap del blog en español: /blog/ y todos sus artículos (con hreflang hacia la versión EN)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('es', 'blog'), { headers: xmlHeaders });
};
