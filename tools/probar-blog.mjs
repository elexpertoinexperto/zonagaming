// Uso:  npm run build && node tools/probar-blog.mjs
// Comprueba sobre dist/ los 19 artículos del blog en español y los 19 en inglés (más los dos índices):
//  - plantilla nueva: un solo H1, migas de pan, índice con anclas que existen, JSON-LD (Article + BreadcrumbList) válido;
//  - TODOS los enlaces internos (a fichas, categorías y subcategorías) apuntan a páginas que existen;
//  - los bloques de compra (PostBuy) llevan a subcategorías reales, en el idioma de la página;
//  - paridad ES ↔ EN: mismas secciones y mismo número de bloques de compra;
//  - los bloques de compra solo aparecen en secciones de decisión (no en las informativas);
//  - ninguna cabecera pegajosa en los artículos.
import fs from 'node:fs';

const SITE = 'https://monckeygamer.com';
const errores = [];
const err = (m) => errores.push(m);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${d}/${e.name}`) : [`${d}/${e.name}`]));
const paginas = new Set(walk('dist').filter((f) => f.endsWith('index.html')).map((f) => f.slice(4).replace('index.html', '')));

// Secciones donde SÍ tiene sentido un bloque de compra (la persona ya está decidiendo)
const SECCIONES_DE_DECISION = new Set(['recomendaciones', 'recomendacion', 'conclusion', 'cual-elegir', 'tabla', 'cuanta', 'gaming', 'que-necesitas', 'airflow', 'estetica']);

const arts = (dir, pref) => fs.readdirSync(dir).filter((f) => f.endsWith('.astro') && f !== 'index.astro').map((f) => f.replace('.astro', '')).map((s) => ({ slug: s, ruta: `${pref}${s}/` }));
const es = arts('src/pages/blog', '/blog/');
const en = arts('src/pages/en/blog', '/en/blog/');
if (es.length !== en.length) err(`hay ${es.length} artículos en ES y ${en.length} en EN`);

const info = {};
for (const [lista, lang] of [[es, 'es'], [en, 'en']]) {
  for (const { slug, ruta } of lista) {
    const h = fs.readFileSync(`dist${ruta}index.html`, 'utf8');
    const ctx = `${ruta}`;
    if ((h.match(/<h1[ >]/g) || []).length !== 1) err(`${ctx}: no tiene exactamente un H1`);
    if (!h.includes('class="post-hero"')) err(`${ctx}: no usa la plantilla nueva`);
    if (!h.includes('class="breadcrumb"')) err(`${ctx}: sin migas de pan`);
    // índice: cada ancla existe
    const anclas = [...new Set([...h.matchAll(/data-sec="([^"]+)"/g)].map((m) => m[1]))];
    for (const a of anclas) if (!h.includes(`id="${a}"`)) err(`${ctx}: el índice enlaza a #${a}, que no existe`);
    if (!anclas.length) err(`${ctx}: índice vacío`);
    // JSON-LD
    const ld = [...h.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => { try { const j = JSON.parse(m[1]); return Array.isArray(j) ? j : [j]; } catch { err(`${ctx}: JSON-LD roto`); return []; } });
    if (!ld.some((x) => x['@type'] === 'Article')) err(`${ctx}: sin schema Article`);
    if (!ld.some((x) => x['@type'] === 'BreadcrumbList')) err(`${ctx}: sin BreadcrumbList`);
    // enlaces internos del cuerpo
    for (const m of h.matchAll(/href="(\/[^"#?]*)"/g)) {
      const u = m[1];
      if (/\.[a-z0-9]{2,5}$/i.test(u)) continue;
      const full = u.endsWith('/') ? u : u + '/';
      if (!paginas.has(full)) err(`${ctx}: enlace roto → ${u}`);
    }
    // bloques de compra
    const bloques = [...h.matchAll(/<aside class="post-buy"[\s\S]*?<\/aside>/g)].map((m) => m[0]);
    for (const b of bloques) {
      for (const m of b.matchAll(/href="([^"]+)"/g)) {
        const u = m[1];
        const esEn = u.startsWith('/en/');
        if (esEn !== (lang === 'en')) err(`${ctx}: bloque de compra con enlace en el idioma equivocado → ${u}`);
        if (u.split('/').filter(Boolean).length !== (esEn ? 3 : 2)) err(`${ctx}: el bloque de compra no apunta a una subcategoría → ${u}`);
      }
    }
    // dónde está cada bloque: la sección inmediatamente anterior debe ser de decisión
    const secciones = [...h.matchAll(/<section id="([^"]+)">|<aside class="post-buy"/g)].map((m) => m[1] ?? '__buy__');
    secciones.forEach((s, i) => { if (s === '__buy__' && !SECCIONES_DE_DECISION.has(secciones[i - 1])) err(`${ctx}: bloque de compra tras una sección informativa (${secciones[i - 1]})`); });
    // cabecera no pegajosa: la regla existe para .page-article
    if (!/class="page page-article"/.test(h)) err(`${ctx}: falta la clase page-article (cabecera fija)`);
    info[`${lang}:${slug}`] = { secciones: secciones.filter((s) => s !== '__buy__').join(','), bloques: bloques.length };
  }
}
for (const { slug } of es) {
  const a = info[`es:${slug}`], b = info[`en:${slug}`];
  if (!b) { err(`${slug}: no existe en inglés`); continue; }
  if (a.secciones !== b.secciones) err(`${slug}: las secciones de ES y EN no coinciden`);
  if (a.bloques !== b.bloques) err(`${slug}: ES tiene ${a.bloques} bloques de compra y EN ${b.bloques}`);
}
// índices del blog
for (const ruta of ['/blog/', '/en/blog/']) {
  const h = fs.readFileSync(`dist${ruta}index.html`, 'utf8');
  const tarjetas = (h.match(/class="blog-card"/g) || []).length + (h.includes('class="blog-destacado"') ? 1 : 0);
  if (tarjetas !== 19) err(`${ruta}: muestra ${tarjetas} artículos, esperados 19`);
  for (const m of h.matchAll(/class="blog-(?:card|destacado)"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*class="blog-(?:card|destacado)"/g)) {
    const u = m[1] ?? m[2];
    if (!paginas.has(u)) err(`${ruta}: la tarjeta apunta a una página que no existe → ${u}`);
  }
}
const totalBloques = Object.values(info).reduce((s, v) => s + v.bloques, 0);
console.log(`Artículos revisados: ${Object.keys(info).length} · bloques de compra: ${totalBloques}`);
if (errores.length) { console.error(`\nERRORES (${errores.length}):\n` + errores.slice(0, 30).map((e) => ' - ' + e).join('\n')); process.exit(1); }
console.log('OK: los artículos del blog cumplen la plantilla, sin enlaces rotos y con la compra solo donde toca.');
