// Uso:  npm run build && node tools/auditar-lastmod-historial.mjs
// Auditoría histórica del sitemap: compila cada commit desde que existe el lastmod real (13-oct-2026) y comprueba que TODA página cuyo
// contenido renderizado cambió entre dos commits tiene hoy un lastmod posterior al commit anterior (el hook lo fecha antes del commit).
// Sale con error si alguna quedó atrasada. La primera vez tarda ~1 min (compila ~12 commits); después usa la caché de .cache-auditoria/.
// Auditoría histórica: compila cada commit desde el sistema de lastmod y comprueba que TODA página cuyo contenido
// renderizado cambió entre dos commits tiene hoy un lastmod >= la fecha del commit que la cambió.
import { execSync } from 'node:child_process';
import { existsSync, rmSync, rmdirSync, symlinkSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { huellasDeDist } from './huella-render.mjs';

const RAIZ = process.cwd();
const sh = (c, o = {}) => execSync(c, { encoding: 'utf8', maxBuffer: 1e9, stdio: ['ignore', 'pipe', 'pipe'], ...o });
const lista = sh('git log "--format=%h;%cI" --reverse c9888a2^..HEAD').trim().split('\n').map((l) => l.trim().split(';'));
const WT = 'D:/Proyecto Astro/_wt_aud';
mkdirSync(`${RAIZ}/.cache-auditoria`, { recursive: true });
const huellas = {};
// Quita el worktree sin tocar el node_modules real: primero se desengancha el enlace (junction) y solo después se borra la carpeta
const quitarWT = () => {
  if (!existsSync(WT)) return;
  try { if (existsSync(`${WT}/node_modules`)) rmdirSync(`${WT}/node_modules`); } catch { /* no era un enlace */ }
  try { sh(`git worktree remove --force "${WT}"`); } catch { rmSync(WT, { recursive: true, force: true }); }
};
for (const [h] of lista) {
  const f = `${RAIZ}/.cache-auditoria/${h}.json`;
  if (existsSync(f)) { huellas[h] = JSON.parse(readFileSync(f, 'utf8')); continue; }
  quitarWT();
  sh(`git worktree add "${WT}" ${h}`);
  symlinkSync(`${RAIZ}/node_modules`, `${WT}/node_modules`, 'junction');
  try { sh('npx astro build', { cwd: WT }); } catch (e) { console.log(h, 'NO COMPILA'); continue; }
  huellas[h] = huellasDeDist(`${WT}/dist`);
  writeFileSync(f, JSON.stringify(huellas[h]));
  console.log(h, 'compilado,', Object.keys(huellas[h]).length, 'páginas');
}
quitarWT();

// lastmod actual de cada ruta, leído de los sitemaps ya construidos en este árbol (dist actual)
const lm = {};
for (const t of ['pages', 'product', 'blog']) for (const l of ['es', 'en']) {
  const xml = readFileSync(`${RAIZ}/dist/sitemap-${t}-${l}.xml`, 'utf8');
  for (const m of xml.matchAll(/<loc>https:\/\/monckeygamer\.com([^<]*)<\/loc><lastmod>([^<]*)<\/lastmod>/g)) lm[m[1]] = m[2];
}
const tipo = (p) => /^\/(en\/)?blog\//.test(p) ? 'blog' : /-\d+\/$/.test(p) ? 'ficha' : p.replace(/^\/en/, '').split('/').filter(Boolean).length >= 2 ? 'subcat' : 'cat/otras';
let total = 0;
for (let i = 1; i < lista.length; i++) {
  const [h, fecha] = lista[i], prev = lista[i - 1][0];
  if (!huellas[h] || !huellas[prev]) continue;
  const t = new Date(lista[i - 1][1]).toISOString(); // el lastmod debe ser POSTERIOR al commit anterior (el hook lo fecha minutos antes del commit)
  const cambiadas = Object.keys(huellas[h]).filter((p) => p !== '/404/' && huellas[prev][p] !== huellas[h][p]);
  const malas = cambiadas.filter((p) => !lm[p] || lm[p] < t);
  const por = {};
  for (const p of malas) por[tipo(p)] = (por[tipo(p)] || 0) + 1;
  total += malas.length;
  console.log(`${h} ${t.slice(0, 16)}  cambió el contenido de ${cambiadas.length} páginas · con lastmod ATRASADO: ${malas.length} ${malas.length ? JSON.stringify(por) : ''}`);
  if (process.env.VERBOSE && malas.length) console.log('   ej:', malas.slice(0, 4).join(' '), `lastmod ${lm[malas[0]]}`);
}
console.log('TOTAL con lastmod atrasado:', total);
if (total) process.exit(1);
