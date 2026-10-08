// Uso:  npm run build && node tools/listar-sitemaps.mjs
// Escribe tools/SITEMAP-URLS.md con TODAS las URLs de cada sitemap (leídas de dist/), para tener a mano cómo quedó el reparto.
import fs from 'node:fs';
const SITE = 'https://monckeygamer.com';
const indice = fs.readFileSync('dist/sitemap.xml', 'utf8');
const hijos = [...indice.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
let total = 0;
let md = `# URLs por sitemap\n\nÍndice: ${SITE}/sitemap.xml\n\n| Sitemap | URLs |\n|---|---|\n`;
const cuerpos = [];
for (const url of hijos) {
  const xml = fs.readFileSync(`dist/${url.replace(SITE + '/', '')}`, 'utf8');
  const locs = [...xml.matchAll(/<url>\s*<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  total += locs.length;
  md += `| ${url} | ${locs.length} |\n`;
  cuerpos.push(`\n## ${url.replace(SITE + '/', '')} (${locs.length})\n\n${locs.map((l) => '- ' + l).join('\n')}\n`);
}
md += `\n**Total: ${total} URLs.**\n` + cuerpos.join('');
fs.writeFileSync(new URL('./SITEMAP-URLS.md', import.meta.url), md);
console.log(`${hijos.length} sitemaps, ${total} URLs → tools/SITEMAP-URLS.md`);
