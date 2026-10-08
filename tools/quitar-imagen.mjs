// Uso:  node tools/quitar-imagen.mjs <categoria>/<id> [<categoria>/<id> ...]
// Revierte una imagen mal descargada (logo genérico, foto de otro modelo…): borra el archivo
// public/imagenes/<categoria>/<id>/fabricante.*, deja el producto con el placeholder en
// productos.json y productos-en.json, y lo quita del manifiesto para que no se vuelva a bajar.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const PLACEHOLDER = '/placeholder-product.svg';
const rutas = ['src/data/productos.json', 'src/data/productos-en.json'].map((f) => path.join(root, f));
const datos = rutas.map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
const manifestPath = path.join(root, 'tools/image-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

for (const arg of process.argv.slice(2)) {
  const [cat, id] = arg.split('/');
  const dir = path.join(root, 'public/imagenes', cat, id);
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) if (f.startsWith('fabricante.')) fs.unlinkSync(path.join(dir, f));
  }
  let tocado = false;
  for (const d of datos) {
    const p = d[cat]?.find((x) => String(x.id) === id);
    if (p) { p.imagenUrl = PLACEHOLDER; tocado = true; }
  }
  if (manifest[cat]) delete manifest[cat][id];
  console.log(tocado ? 'quitada ' : 'no existe ', arg);
}
rutas.forEach((f, i) => fs.writeFileSync(f, JSON.stringify(datos[i], null, 2)));
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
