// Uso:  node tools/probar-urls.mjs <archivo.json>
// El JSON es { "categoria": { "id": "url candidata" } }.
// Prueba cada URL (con pausa de 3-6 s entre peticiones), y si la página responde 200 y trae
// og:image propia (no el logo genérico del sitio) la escribe en tools/image-manifest.json.
// Las que fallan quedan en tools/probar-urls-fallos.json para buscarlas a mano.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const input = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const manifestPath = path.join(root, 'tools/image-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
// PAUSA=segundos (por defecto 3): pausa base entre peticiones; sube a 20 si un sitio responde 429
const PAUSA = Number(process.env.PAUSA || 3);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GENERICA = /(^|\/)ogimage\.\w+(\?|$)|logo|default|placeholder|ProductLine/i;

function ogImage(html) {
  const m =
    html.match(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  return m && m[1];
}

const fallos = {};
for (const [cat, items] of Object.entries(input)) {
  for (const [id, url] of Object.entries(items)) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const img = ogImage(await r.text());
      if (!img) throw new Error('sin og:image');
      if (GENERICA.test(img)) throw new Error('imagen genérica: ' + img);
      (manifest[cat] ||= {})[id] = url;
      console.log('OK   ', cat, id, img);
    } catch (e) {
      (fallos[cat] ||= {})[id] = `${url}  (${e.message})`;
      console.log('FALLA', cat, id, e.message);
    }
    await sleep(PAUSA * 1000 + Math.random() * PAUSA * 1000);
  }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
fs.writeFileSync(path.join(root, 'tools/probar-urls-fallos.json'), JSON.stringify(fallos, null, 2));
