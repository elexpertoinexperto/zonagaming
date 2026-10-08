import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap de páginas en inglés: inicio, recommender, contacto, categorías y subcategorías (con hreflang hacia la versión ES)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('en', 'pages'), { headers: xmlHeaders });
};
