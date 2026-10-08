// Uso (desde la raíz del proyecto):  node tools/descargar-imagenes.mjs [categoria]
// Lee tools/image-manifest.json  { categoria: { id: urlPaginaOficial } }
// Descarga la imagen principal (og:image) de la página oficial del fabricante a
// public/imagenes/<categoria>/<id>/fabricante.<ext> y actualiza imagenUrl en
// src/data/productos.json y productos-en.json. Solo toca productos con placeholder.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { aWebp } from './optimizar-imagenes.mjs';

const root = process.cwd();
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'tools/image-manifest.json'), 'utf8'));
const only = process.argv[2];
const files = ['src/data/productos.json', 'src/data/productos-en.json'].map((f) => path.join(root, f));
const data = files.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findImage(html, base) {
  const pick = (re) => { const m = html.match(re); return m && m[1]; };
  const u =
    pick(/<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i) ||
    pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
    pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  return u ? new URL(u.replace(/&amp;/g, '&'), base).href : null;
}

// Algunas tiendas sirven la og:image en miniatura; se pide la versión grande del mismo archivo.
// Corsair (Cloudinary): ...c_scale%2Cq_auto%2Cw_96/... → w_800
function agrandar(u) {
  if (!u) return u;
  return u.replace(/(c_scale%2Cq_auto%2C)w_\d+/, '$1w_800');
}

// Huellas de las imágenes ya guardadas: si dos productos distintos bajan EXACTAMENTE la misma imagen
// es un logo o banner genérico del fabricante (pasó con Samsung, AOC y Sparkle), no la foto del producto.
const huellas = new Map();
const base = path.join(root, 'public/imagenes');
if (fs.existsSync(base)) {
  for (const c of fs.readdirSync(base)) {
    const dc = path.join(base, c);
    if (!fs.statSync(dc).isDirectory()) continue;
    for (const i of fs.readdirSync(dc)) {
      const f = fs.readdirSync(path.join(dc, i)).find((n) => n.startsWith('fabricante.'));
      if (f) huellas.set(crypto.createHash('md5').update(fs.readFileSync(path.join(dc, i, f))).digest('hex'), c + '/' + i);
    }
  }
}

const report = { ok: [], fail: [] };
for (const [cat, items] of Object.entries(manifest)) {
  if (only && only !== cat) continue;
  for (const [id, page] of Object.entries(items)) {
    const num = Number(id);
    const prod = data[0][cat]?.find((p) => p.id === num);
    if (!prod) { report.fail.push([cat, id, 'producto no existe']); continue; }
    if (!String(prod.imagenUrl).includes('placeholder')) continue; // ya tiene imagen
    try {
      const r = await fetch(page, { headers: { 'User-Agent': UA, Accept: 'text/html' }, redirect: 'follow' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const img = agrandar(findImage(await r.text(), page));
      if (!img) throw new Error('sin og:image');
      const ir = await fetch(img, { headers: { 'User-Agent': UA, Referer: page } });
      if (!ir.ok) throw new Error('imagen HTTP ' + ir.status);
      const type = ir.headers.get('content-type') || '';
      if (!type.startsWith('image/')) throw new Error('no es imagen: ' + type);
      const esSvg = type.includes('svg');
      const ext = esSvg ? 'svg' : 'webp'; // todo raster se guarda como WebP ligero (máx. 900 px)
      const dir = path.join(root, 'public/imagenes', cat, String(id));
      fs.mkdirSync(dir, { recursive: true });
      const buf = Buffer.from(await ir.arrayBuffer());
      if (buf.length < 6000) throw new Error('imagen demasiado pequeña (' + buf.length + ' bytes), probablemente miniatura o genérica');
      const huella = crypto.createHash('md5').update(buf).digest('hex');
      const otro = huellas.get(huella);
      if (otro && otro !== cat + '/' + id) throw new Error('imagen idéntica a la de ' + otro + ' (logo o banner genérico)');
      huellas.set(huella, cat + '/' + id);
      fs.writeFileSync(path.join(dir, `fabricante.${ext}`), esSvg ? buf : await aWebp(buf));
      const rel = `/imagenes/${cat}/${id}/fabricante.${ext}`;
      for (const d of data) { const p = d[cat].find((x) => x.id === num); if (p) p.imagenUrl = rel; }
      report.ok.push([cat, id, rel]);
      console.log('OK  ', cat, id, rel);
    } catch (e) {
      report.fail.push([cat, id, e.message, page]);
      console.log('FALLA', cat, id, e.message);
    }
    await sleep(4000 + Math.random() * 6000); // pausa 4-10 s entre productos (cortesía con los servidores)
  }
}
files.forEach((f, i) => fs.writeFileSync(f, JSON.stringify(data[i], null, 2)));
fs.writeFileSync(path.join(root, 'tools/imagenes-reporte.json'), JSON.stringify(report, null, 2));
console.log(`\nListo: ${report.ok.length} imágenes, ${report.fail.length} fallas (ver tools/imagenes-reporte.json)`);
