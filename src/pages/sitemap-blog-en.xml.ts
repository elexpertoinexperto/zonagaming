import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap del blog en inglés: /en/blog/ y todos sus artículos (con hreflang hacia la versión ES)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('en', 'blog'), { headers: xmlHeaders });
};
