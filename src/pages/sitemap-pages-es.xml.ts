import type { APIRoute } from 'astro';
import { buildUrlset, xmlHeaders } from '../lib/sitemap-data';

// Sitemap de páginas en español: inicio, recomendador, contacto, categorías y subcategorías (con hreflang hacia la versión EN)
export const GET: APIRoute = () => {
  return new Response(buildUrlset('es', 'pages'), { headers: xmlHeaders });
};
