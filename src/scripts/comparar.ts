// Comparador de productos (ES y EN), sin librerías:
//  · cada tarjeta de producto trae una casilla «Comparar» (ProductCard.astro);
//  · al marcar una aparece abajo la bandeja (CompareTray.astro) con hasta 4 productos de la MISMA categoría y el botón «Comparar»;
//  · el botón lleva a /comparar/?c=<categoria>&ids=1,2,3 (EN: /en/compare/), que pinta la tabla con los datos de
//    /datos/comparar-<categoria>-<idioma>.json (generado en el build desde el catálogo: src/pages/datos/[archivo].json.ts).
// La selección se guarda en el navegador (localStorage) por idioma, así sigue ahí al cambiar de página.
const LANG: 'es' | 'en' = document.documentElement.lang.startsWith('en') ? 'en' : 'es';
const KEY = `mg-comparar-${LANG}`;
const MAX = 4;

type Item = { id: number; name: string; img: string; href: string };
type State = { cat: string; items: Item[] };

const leer = (): State => {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && typeof s.cat === 'string' && Array.isArray(s.items)) return s;
  } catch { /* sin almacenamiento: la selección dura lo que dure la página */ }
  return { cat: '', items: [] };
};
let estado = leer();
const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch { /* idem */ } };
const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const evento = (nombre: string, datos: Record<string, unknown>) => { (window as any).dataLayer?.push({ event: nombre, ...datos }); };

const tray = document.getElementById('cmp-tray');
const pagina = document.getElementById('cmp-page');
// textos: los de la bandeja más los de la página del comparador (cada componente trae los suyos)
const T: Record<string, string> = { ...JSON.parse(tray?.dataset.t || '{}'), ...JSON.parse(pagina?.dataset.t || '{}') };
const urlComparar = tray?.dataset.url || (LANG === 'en' ? '/en/compare/' : '/comparar/');
const enlace = () => `${urlComparar}?c=${encodeURIComponent(estado.cat)}&ids=${estado.items.map((i) => i.id).join(',')}`;

// ── Bandeja + casillas ──────────────────────────────────────────────────
function pintarBandeja(mensaje = '') {
  document.querySelectorAll<HTMLInputElement>('input.cmp-input').forEach((inp) => {
    const dentro = inp.dataset.cat === estado.cat && estado.items.some((i) => i.id === Number(inp.dataset.id));
    inp.checked = dentro;
    inp.disabled = !dentro && inp.dataset.cat === estado.cat && estado.items.length >= MAX;
  });
  if (!tray) return;
  const visible = estado.items.length > 0 && !pagina;
  tray.hidden = !visible;
  document.documentElement.classList.toggle('cmp-abierta', visible);
  if (!visible) return;
  const huecos = Array.from({ length: MAX }, (_, k) => estado.items[k]);
  tray.querySelector('#cmp-slots')!.innerHTML = huecos.map((it, k) => it
    ? `<div class="cmp-slot"><img src="${esc(it.img)}" alt="" loading="lazy" /><span>${esc(it.name)}</span><button type="button" class="cmp-quitar" data-id="${it.id}" aria-label="${esc(T.quitar)}: ${esc(it.name)}">×</button></div>`
    : `<div class="cmp-slot cmp-vacio" aria-hidden="true"><span>${k === estado.items.length ? esc(T.anade) : ''}</span></div>`).join('');
  const ir = tray.querySelector<HTMLAnchorElement>('#cmp-go')!;
  const listo = estado.items.length >= 2;
  ir.textContent = `${T.comparar} (${estado.items.length})`;
  ir.href = listo ? enlace() : '#';
  ir.setAttribute('aria-disabled', String(!listo));
  tray.querySelector('#cmp-msg')!.textContent = mensaje || (listo ? '' : T.minimo);
}

document.addEventListener('change', (e) => {
  const inp = e.target as HTMLInputElement;
  if (!inp?.classList?.contains('cmp-input')) return;
  const item: Item = { id: Number(inp.dataset.id), name: inp.dataset.name || '', img: inp.dataset.img || '', href: inp.dataset.href || '' };
  let mensaje = '';
  if (inp.checked) {
    if (estado.cat !== inp.dataset.cat) {
      if (estado.items.length) mensaje = T.otraCategoria;
      estado = { cat: inp.dataset.cat || '', items: [] };
    }
    if (estado.items.length < MAX && !estado.items.some((i) => i.id === item.id)) estado.items.push(item);
    if (estado.items.length === MAX) mensaje = T.maximo;
    evento('compare_add', { compare_category: estado.cat, compare_count: estado.items.length });
  } else {
    estado.items = estado.items.filter((i) => i.id !== item.id);
  }
  guardar();
  pintarBandeja(mensaje);
});

tray?.addEventListener('click', (e) => {
  const el = e.target as HTMLElement;
  if (el.classList.contains('cmp-quitar')) {
    estado.items = estado.items.filter((i) => i.id !== Number(el.dataset.id));
  } else if (el.id === 'cmp-clear') {
    estado = { cat: '', items: [] };
  } else if (el.id === 'cmp-go') {
    if (el.getAttribute('aria-disabled') === 'true') e.preventDefault();
    else evento('compare_open', { compare_category: estado.cat, compare_count: estado.items.length });
    return;
  } else return;
  guardar();
  pintarBandeja();
});

// Otra pestaña cambió la selección
window.addEventListener('storage', (e) => { if (e.key === KEY) { estado = leer(); pintarBandeja(); } });
pintarBandeja();

// ── Página de comparación ───────────────────────────────────────────────
type Prod = { id: number; n: string; m?: string; p: number; f?: string; img: string; href: string; specs: Record<string, string>; pts?: number; nivel?: string };
type Datos = { cat: string; nombre: string; base: string; items: Prod[] };

async function pintarPagina() {
  if (!pagina) return;
  const q = new URLSearchParams(location.search);
  const cat = q.get('c') || estado.cat;
  let ids = (q.get('ids') || estado.items.map((i) => i.id).join(',')).split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, MAX);
  const vacio = pagina.querySelector<HTMLElement>('#cmp-empty')!;
  const cuerpo = pagina.querySelector<HTMLElement>('#cmp-body')!;
  const sinNada = () => { vacio.hidden = false; cuerpo.hidden = true; };
  if (!cat || !/^[a-z-]+$/.test(cat) || !ids.length) return sinNada();

  let datos: Datos;
  try {
    const r = await fetch(`/datos/comparar-${cat}-${LANG}.json`);
    if (!r.ok) throw new Error(String(r.status));
    datos = await r.json();
  } catch { return sinNada(); }

  const fecha = (f?: string) => {
    if (!f) return '';
    const d = new Date(`${f.slice(0, 10)}T12:00:00Z`);
    return isNaN(+d) ? '' : d.toLocaleDateString(LANG === 'en' ? 'en-US' : 'es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  };
  const dinero = (n: number) => `$${n.toFixed(2)}`;

  const render = () => {
    const prods = ids.map((id) => datos.items.find((p) => p.id === id)).filter(Boolean) as Prod[];
    if (!prods.length) return sinNada();
    vacio.hidden = true; cuerpo.hidden = false;
    // la selección guardada y la URL quedan iguales a lo que se ve
    estado = { cat, items: prods.map((p) => ({ id: p.id, name: p.n, img: p.img, href: p.href })) };
    guardar();
    history.replaceState(null, '', `${location.pathname}?c=${cat}&ids=${prods.map((p) => p.id).join(',')}`);

    const minPrecio = Math.min(...prods.map((p) => p.p));
    const maxPts = Math.max(...prods.map((p) => p.pts ?? -1));
    const varios = prods.length > 1;
    const claves: string[] = [];
    for (const p of prods) for (const k of Object.keys(p.specs)) if (!claves.includes(k)) claves.push(k);

    const fila = (etiqueta: string, celdas: string[], crudo: string[]) => {
      const iguales = varios && crudo.every((v) => v === crudo[0]);
      return `<tr class="${iguales ? 'cmp-igual' : ''}"><th scope="row">${esc(etiqueta)}</th>${celdas.map((c) => `<td>${c}</td>`).join('')}${hueco}</tr>`;
    };
    const hueco = prods.length < MAX ? '<td class="cmp-hueco"></td>' : '';
    const cabecera = prods.map((p) => `<th scope="col" class="cmp-col">
        <button type="button" class="cmp-x" data-id="${p.id}" aria-label="${esc(T.quitar)}: ${esc(p.n)}">×</button>
        <a class="cmp-foto" href="${esc(p.href)}"><img src="${esc(p.img)}" alt="${esc(p.n)}" loading="lazy" /></a>
        ${p.m ? `<span class="cmp-marca">${esc(p.m)}</span>` : ''}
        <a class="cmp-nombre" href="${esc(p.href)}">${esc(p.n)}</a>
        <a class="btn btn-small" href="${esc(p.href)}">${esc(T.detalles)}</a>
      </th>`).join('') + (prods.length < MAX ? `<th scope="col" class="cmp-col cmp-hueco"><a class="cmp-mas" href="${esc(datos.base)}/">+ ${esc(T.anadeOtro)}</a></th>` : '');

    const filas = [
      fila(T.precio, prods.map((p) => `<strong class="cmp-precio">${dinero(p.p)}</strong> USD${varios && p.p === minPrecio ? ` <span class="cmp-pill">${esc(T.masBarato)}</span>` : ''}${fecha(p.f) ? `<small>${esc(T.revisado)} ${esc(fecha(p.f))}</small>` : ''}`), prods.map((p) => String(p.p))),
      prods.some((p) => p.pts != null) ? fila(T.rendimiento, prods.map((p) => p.pts == null ? '—' : `<span class="cmp-barra"><i style="width:${Math.min(100, (p.pts / 270) * 100).toFixed(1)}%"></i></span>${Math.round(p.pts)} ${esc(T.puntos)}${varios && p.pts === maxPts ? ` <span class="cmp-pill">${esc(T.masPotente)}</span>` : ''}`), prods.map((p) => String(p.pts))) : '',
      prods.some((p) => p.nivel) ? fila(T.gama, prods.map((p) => esc(p.nivel || '—')), prods.map((p) => p.nivel || '')) : '',
      ...claves.map((k) => fila(k, prods.map((p) => esc(p.specs[k] ?? '—')), prods.map((p) => p.specs[k] ?? ''))),
    ].join('');

    cuerpo.innerHTML = `
      <p class="cmp-sub">${esc(T.comparando)} <strong>${prods.length}</strong> · <a href="${esc(datos.base)}/">${esc(datos.nombre)}</a></p>
      ${varios ? `<label class="cmp-solo"><input type="checkbox" id="cmp-solo-dif" /> <span>${esc(T.soloDiferencias)}</span></label>` : ''}
      <div class="cmp-scroll"><table class="cmp-tabla"><thead><tr><td class="cmp-esquina"></td>${cabecera}</tr></thead><tbody>${filas}</tbody></table></div>
      <p class="cmp-nota">${esc(T.nota)}</p>`;
  };

  cuerpo.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    if (!el.classList.contains('cmp-x')) return;
    ids = ids.filter((id) => id !== Number(el.dataset.id));
    if (!ids.length) { estado = { cat: '', items: [] }; guardar(); history.replaceState(null, '', location.pathname); return sinNada(); }
    render();
  });
  cuerpo.addEventListener('change', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.id === 'cmp-solo-dif') cuerpo.classList.toggle('cmp-dif', el.checked);
  });
  render();
}
pintarPagina();
