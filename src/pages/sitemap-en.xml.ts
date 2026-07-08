import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap de la versión en inglés (con hreflang hacia la versión ES)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('en'), { headers: xmlHeaders });
};
