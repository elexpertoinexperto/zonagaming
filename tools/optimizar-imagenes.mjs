// Uso:  node tools/optimizar-imagenes.mjs
// Reduce el peso de las imágenes de fabricante (public/imagenes/*/*/fabricante.*): las pasa a WebP,
// con un máximo de 900 px de lado mayor, y actualiza imagenUrl en productos.json y productos-en.json.
// Solo toca las que superan 150 KB o no son WebP. También lo usa descargar-imagenes.mjs al bajar nuevas.
// (Las páginas de producto muestran la foto a ~500 px: 900 px cubre pantallas retina sin pasarse.)
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export async function aWebp(buffer) {
  return sharp(buffer).rotate().resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 }).toBuffer();
}

async function main() {
  const root = process.cwd();
  const base = path.join(root, 'public/imagenes');
  const rutasJson = ['src/data/productos.json', 'src/data/productos-en.json'].map((f) => path.join(root, f));
  const datos = rutasJson.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
  let antes = 0, despues = 0, n = 0;
  for (const cat of fs.readdirSync(base)) {
    const dc = path.join(base, cat);
    if (!fs.statSync(dc).isDirectory()) continue;
    for (const id of fs.readdirSync(dc)) {
      const dir = path.join(dc, id);
      const f = fs.readdirSync(dir).find((x) => x.startsWith('fabricante.'));
      if (!f) continue;
      const ruta = path.join(dir, f);
      const buf = fs.readFileSync(ruta);
      if (f.endsWith('.webp') && buf.length < 150 * 1024) continue;
      const out = await aWebp(buf);
      fs.writeFileSync(path.join(dir, 'fabricante.webp'), out);
      if (!f.endsWith('.webp')) fs.unlinkSync(ruta);
      const rel = `/imagenes/${cat}/${id}/fabricante.webp`;
      for (const d of datos) {
        const p = d[cat]?.find((x) => String(x.id) === id);
        if (p) p.imagenUrl = rel;
      }
      antes += buf.length; despues += out.length; n++;
    }
  }
  rutasJson.forEach((f, i) => fs.writeFileSync(f, JSON.stringify(datos[i], null, 2)));
  console.log(`${n} imágenes optimizadas: ${(antes / 1048576).toFixed(1)} MB → ${(despues / 1048576).toFixed(1)} MB`);
}

if (process.argv[1] && import.meta.url.endsWith(path.basename(process.argv[1]))) await main();
