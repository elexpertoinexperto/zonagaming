// Uso (desde la raíz):  node tools/optimizar-fotos-producto.mjs [--simular] [--verificar]
// Deja las fotos de producto locales ligeras y con versiones por tamaño:
//   1. toda foto local que no sea WebP (p. ej. los PNG transparentes de 300 KB–1 MB) se pasa a WebP (máx. 900 px, transparencia incluida) y se
//      actualiza imagenUrl en productos.json y productos-en.json; el PNG sustituido se borra (queda en git). Las WebP de más de 900 px o de más
//      de 150 KB se reducen en el mismo sitio.
//   2. las WebP de más de 560 px de ancho reciben una versión de 480 px (`nombre-480.webp`) y se anotan en src/data/imagenes-variantes.json
//      { "/imagenes/..webp": { "w": ancho real, "s": "/imagenes/..-480.webp" } }; ProductCard las usa en srcset/sizes (el móvil y los
//      escritorios de pantalla normal bajan 480 px en vez de 900 px para una tarjeta que se ve a unos 260 px).
//   --simular   solo cuenta lo que haría, sin escribir nada.
//   --verificar solo comprueba (código 1 si algo falla): todas las fotos locales son WebP/SVG ligeras, existen y tienen su variante cuando toca.
// Es idempotente: se puede ejecutar siempre que se añadan productos o fotos nuevas (después de descargar-imagenes.mjs).
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const PUBLIC = path.join(root, 'public');
const MAX = 900, UMBRAL_VARIANTE = 560, ANCHO_VARIANTE = 480, MAX_KB = 150, TOPE_KB = 200; // se intenta reducir >150 KB; la verificación solo falla por >200 KB
const simular = process.argv.includes('--simular');
const verificar = process.argv.includes('--verificar');

const rutasJson = ['src/data/productos.json', 'src/data/productos-en.json'].map((f) => path.join(root, f));
const crudo = rutasJson.map((f) => fs.readFileSync(f, 'utf8'));
const datos = crudo.map((t) => JSON.parse(t));
const rutaManifiesto = path.join(root, 'src/data/imagenes-variantes.json');
const manifiesto = fs.existsSync(rutaManifiesto) ? JSON.parse(fs.readFileSync(rutaManifiesto, 'utf8')) : {};

const aFichero = (url) => {
  const a = path.join(PUBLIC, url);
  return fs.existsSync(a) ? a : path.join(PUBLIC, decodeURIComponent(url));
};
const esLocalRaster = (url) => url && !/^https?:/.test(url) && !url.endsWith('.svg');
const kb = (n) => (n / 1024).toFixed(0);

const errores = [];
let convertidas = 0, reducidas = 0, variantes = 0, antes = 0, despues = 0;
const nuevaUrl = new Map(); // url vieja → url nueva
const nuevoManifiesto = {};

const unicas = new Set();
for (const [cat, lista] of Object.entries(datos[0])) for (const p of lista) if (esLocalRaster(p.imagenUrl)) unicas.add(p.imagenUrl);

for (const url of [...unicas].sort()) {
  const origen = aFichero(url);
  if (!fs.existsSync(origen)) { errores.push(`no existe el archivo de ${url}`); continue; }
  const buf = fs.readFileSync(origen);
  const meta = await sharp(buf).metadata();
  const esWebp = url.endsWith('.webp');
  let destinoUrl = esWebp ? url : url.replace(/\.[^./]+$/, '.webp');
  let destino = aFichero(url).replace(/\.[^./\\]+$/, '.webp');
  let ancho = meta.width;

  const hayQueConvertir = !esWebp;
  const hayQueReducir = esWebp && (meta.width > MAX || buf.length > MAX_KB * 1024);
  if (verificar) {
    if (hayQueConvertir) errores.push(`${url}: no es WebP ni SVG (${kb(buf.length)} KB)`);
    if (esWebp && (meta.width > MAX || buf.length > TOPE_KB * 1024)) errores.push(`${url}: WebP demasiado grande (${meta.width} px, ${kb(buf.length)} KB)`);
  } else if (hayQueConvertir || hayQueReducir) {
    const out = await sharp(buf).rotate().resize({ width: MAX, height: MAX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82, effort: 5, alphaQuality: 90 }).toBuffer();
    // Si reducir no mejora nada (ya estaba bien comprimida) se deja como estaba
    if (hayQueConvertir || out.length < buf.length) {
      antes += buf.length; despues += out.length;
      ancho = (await sharp(out).metadata()).width;
      if (!simular) {
        fs.writeFileSync(destino, out);
        if (hayQueConvertir) fs.unlinkSync(origen);
      }
      if (hayQueConvertir) { convertidas++; nuevaUrl.set(url, destinoUrl); } else reducidas++;
    }
  }

  // Variante de 480 px para las anchas
  const urlFinal = nuevaUrl.get(url) ?? url;
  const ficheroFinal = nuevaUrl.has(url) ? destino : origen;
  if (!simular || fs.existsSync(ficheroFinal)) {
    const anchoReal = simular && !fs.existsSync(ficheroFinal) ? ancho : (await sharp(simular && hayQueConvertir ? buf : fs.readFileSync(ficheroFinal)).metadata()).width;
    if (anchoReal > UMBRAL_VARIANTE) {
      const urlVar = urlFinal.replace(/\.webp$/, `-${ANCHO_VARIANTE}.webp`);
      const ficheroVar = aFichero(urlFinal).replace(/\.webp$/, `-${ANCHO_VARIANTE}.webp`);
      nuevoManifiesto[urlFinal] = { w: anchoReal > MAX ? MAX : anchoReal, s: urlVar };
      if (verificar) {
        if (!fs.existsSync(ficheroVar)) errores.push(`${urlFinal}: falta la variante de ${ANCHO_VARIANTE} px`);
        else if (manifiesto[urlFinal]?.s !== urlVar) errores.push(`${urlFinal}: no está en imagenes-variantes.json`);
      } else if (!fs.existsSync(ficheroVar) || fs.statSync(ficheroVar).mtimeMs < fs.statSync(ficheroFinal).mtimeMs) {
        if (!simular) {
          const v = await sharp(fs.readFileSync(ficheroFinal)).resize({ width: ANCHO_VARIANTE, withoutEnlargement: true }).webp({ quality: 80, effort: 5, alphaQuality: 90 }).toBuffer();
          fs.writeFileSync(ficheroVar, v);
        }
        variantes++;
      }
    }
  }
}

if (verificar) {
  const sobran = Object.keys(manifiesto).filter((u) => !(u in nuevoManifiesto));
  for (const u of sobran) errores.push(`imagenes-variantes.json tiene «${u}», que ya no hace falta`);
  if (errores.length) { console.error(`${errores.length} problema(s):`); errores.slice(0, 30).forEach((e) => console.error(' - ' + e)); process.exit(1); }
  console.log(`OK: ${unicas.size} fotos locales, todas WebP ligeras, con su variante de ${ANCHO_VARIANTE} px donde toca (${Object.keys(nuevoManifiesto).length}).`);
  process.exit(0);
}

// Actualiza imagenUrl en ES y EN (el EN comparte foto con el ES salvo los placeholders SVG)
if (nuevaUrl.size && !simular) {
  const idaYVuelta = datos.every((d, i) => JSON.stringify(d, null, 2) === crudo[i]);
  if (!idaYVuelta) { console.error('Abortado: reescribir los JSON cambiaría su formato; no se ha tocado ninguno.'); process.exit(1); }
  for (const d of datos) for (const lista of Object.values(d)) for (const p of lista) if (nuevaUrl.has(p.imagenUrl)) p.imagenUrl = nuevaUrl.get(p.imagenUrl);
  rutasJson.forEach((f, i) => fs.writeFileSync(f, JSON.stringify(datos[i], null, 2)));
}
if (!simular) fs.writeFileSync(rutaManifiesto, JSON.stringify(nuevoManifiesto, null, 2) + '\n');

errores.forEach((e) => console.error('AVISO: ' + e));
console.log(`${simular ? '[simulación] ' : ''}${convertidas} convertidas a WebP, ${reducidas} reducidas, ${variantes} variantes de ${ANCHO_VARIANTE} px nuevas; ` +
  `${kb(antes)} KB → ${kb(despues)} KB en lo procesado; ${Object.keys(nuevoManifiesto).length} fotos con srcset.`);
