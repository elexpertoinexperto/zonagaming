// Uso:  npm run build && npx -y -p xmllint-wasm node tools/validar-sitemaps-xsd.mjs
// (o instala antes "xmllint-wasm" en una carpeta temporal y apunta NODE_PATH a ella)
// Valida dist/sitemap*.xml contra los esquemas OFICIALES de sitemaps.org (sitemap.xsd y siteindex.xsd), que se descargan
// en el momento. En el XSD de sitemap se pasa de processContents="strict" a "lax" porque los <xhtml:link> de hreflang
// (extensión de Google) pertenecen a otro espacio de nombres y el esquema oficial no los define.
import fs from 'node:fs';

let validateXML;
try {
  ({ validateXML } = await import('xmllint-wasm'));
} catch {
  console.error('Falta el paquete xmllint-wasm. Instálalo con:  npm i --no-save xmllint-wasm');
  process.exit(2);
}

const baja = async (f) => (await fetch(`https://www.sitemaps.org/schemas/sitemap/0.9/${f}`)).text();
const sitemapXsd = (await baja('sitemap.xsd')).replace('processContents="strict"', 'processContents="lax"');
const indexXsd = await baja('siteindex.xsd');

let fallos = 0;
for (const f of fs.readdirSync('dist').filter((n) => /^sitemap.*\.xml$/.test(n))) {
  const xml = fs.readFileSync(`dist/${f}`, 'utf8');
  const r = await validateXML({
    xml: [{ fileName: f, contents: xml }],
    schema: [{ fileName: 'schema.xsd', contents: f === 'sitemap.xml' ? indexXsd : sitemapXsd }],
  });
  console.log(f.padEnd(26), r.valid ? 'VÁLIDO' : `INVÁLIDO (${r.errors.length} errores): ${r.errors[0]?.message}`);
  if (!r.valid) fallos++;
}
if (fallos) process.exit(1);
console.log('OK: todos los sitemaps cumplen el esquema oficial de sitemaps.org.');
