// Huella del CONTENIDO RENDERIZADO de una página ya construida (dist/**/index.html): lo que ve quien lee la página,
// sin la cabecera, el pie, los scripts, los estilos ni los identificadores internos de Astro.
// Es la «verdad» contra la que se comprueba que el lastmod de cada URL nunca se quede atrasado (ver verificar-lastmod.mjs).
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Lo que en el <head> es contenido para buscadores: title, meta description, robots, canonical y datos estructurados (JSON-LD).
// (Los demás elementos del head —hojas de estilo, scripts, iconos— cambian con la plantilla y no cuentan.)
function cabezaRelevante(html) {
  const head = html.slice(0, Math.max(0, html.indexOf('</head>')));
  const piezas = [];
  const title = head.match(/<title>[\s\S]*?<\/title>/i);
  if (title) piezas.push(title[0]);
  for (const m of head.matchAll(/<meta\b[^>]*\bname="(?:description|robots)"[^>]*>/gi)) piezas.push(m[0]);
  for (const m of head.matchAll(/<link\b[^>]*\brel="canonical"[^>]*>/gi)) piezas.push(m[0]);
  for (const m of head.matchAll(/<script\b[^>]*ld\+json[^>]*>[\s\S]*?<\/script>/gi)) piezas.push(m[0]);
  return piezas.join('');
}

export function contenidoRender(html) {
  const cabeza = cabezaRelevante(html);
  let b = html.slice(Math.max(0, html.indexOf('<body')));
  b = b.replace(/<!--[\s\S]*?-->/g, '');
  // se quitan los scripts salvo los de datos estructurados (JSON-LD), que SÍ son contenido
  b = b.replace(/<script\b([^>]*)>[\s\S]*?<\/script>/gi, (m, a) => (/ld\+json/.test(a) ? m : ''));
  b = b.replace(/<(style|noscript|dialog)\b[\s\S]*?<\/\1>/gi, ''); // dialog = buscador de la cabecera (plantilla)
  b = b.replace(/<header\b[\s\S]*?<\/header>/i, '').replace(/<footer\b[\s\S]*<\/footer>/i, '');
  b = b.replace(/\sdata-astro-cid-[a-z0-9]+(="[^"]*")?/gi, '').replace(/\sclass="([^"]*)"/g, (m, c) => ` class="${c.replace(/\s+astro-[a-z0-9]+/g, '')}"`);
  return (cabeza + b).replace(/\s+/g, ' ').trim();
}

export const huellaRender = (html) => createHash('sha256').update(contenidoRender(html)).digest('hex').slice(0, 16);

// { '/ruta/': huella } para todas las páginas de una carpeta dist (rutas tal cual: '/mouse/', '/en/gaming-mice/'…)
export function huellasDeDist(dist) {
  const out = {};
  const recorre = (dir) => {
    for (const n of readdirSync(dir)) {
      const p = join(dir, n);
      if (statSync(p).isDirectory()) recorre(p);
      else if (n === 'index.html') out['/' + p.slice(dist.length + 1).replace(/\\/g, '/').replace(/index\.html$/, '')] = huellaRender(readFileSync(p, 'utf8'));
    }
  };
  recorre(dist);
  return out;
}
