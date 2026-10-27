// Buscador de la lupa de la cabecera. Sin librerías: el índice (/buscar-es.json o /buscar-en.json, generado en el build)
// se descarga solo al abrir la lupa. Los resultados salen en este orden de prioridad:
//   1.º Catálogo (categorías y subcategorías) · 2.º Productos concretos · 3.º Guías del blog
// Atajos: «/» o Ctrl/Cmd+K abren; ↑ ↓ eligen; Enter va al resultado; Esc cierra.
type Entrada = { y: 'c' | 's' | 'p' | 'b'; t: string; u: string; s?: string; k?: string; p?: string };
type Item = Entrada & { ft: string; fh: string };

const dlg = document.getElementById('buscador') as HTMLDialogElement | null;
const input = document.getElementById('buscador-input') as HTMLInputElement | null;
const lista = document.getElementById('buscador-lista') as HTMLUListElement | null;
const estado = document.getElementById('buscador-estado');
const abridores = document.querySelectorAll<HTMLElement>('[data-abrir-buscador]');

if (dlg && input && lista && estado) {
  const lang: 'es' | 'en' = dlg.dataset.lang === 'en' ? 'en' : 'es';
  const T = lang === 'en'
    ? { catalogo: 'Catalog', productos: 'Products', guias: 'Guides', explora: 'Explore the catalog', cargando: 'Loading…',
        nada: (q: string) => `We found nothing for “${q}”. Try another word, such as “RTX”, “keyboard” or a brand.`,
        n: (x: number) => `${x} results` }
    : { catalogo: 'Catálogo', productos: 'Productos', guias: 'Guías', explora: 'Explora el catálogo', cargando: 'Cargando…',
        nada: (q: string) => `No encontramos nada para «${q}». Prueba con otra palabra, como «RTX», «teclado» o una marca.`,
        n: (x: number) => `${x} resultados` };

  // Texto sin tildes ni mayúsculas, carácter a carácter para que los índices coincidan con el original (resaltado)
  const fold = (s: string) => Array.from(s, (c) => c.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).join('').toLowerCase();

  let indice: Item[] | null = null;
  let cargando: Promise<void> | null = null;
  const cargar = () => {
    cargando ??= fetch(`/buscar-${lang}.json`)
      .then((r) => r.json())
      .then((d: Entrada[]) => {
        indice = d.map((e) => ({ ...e, ft: fold(e.t), fh: fold(`${e.t} ${e.s ?? ''} ${e.k ?? ''}`) }));
      })
      .catch(() => { cargando = null; });
    return cargando;
  };

  const dl = (ev: Record<string, unknown>) => ((window as any).dataLayer ??= []).push(ev);

  // ── Búsqueda ────────────────────────────────────────────────
  const puntuar = (it: Item, tokens: string[], frase: string) => {
    let sc = 0;
    if (it.ft === frase) sc += 100;
    else if (it.ft.startsWith(frase)) sc += 60;
    else if (it.ft.includes(frase)) sc += 40;
    let todosEnTitulo = true;
    for (const tk of tokens) {
      if (` ${it.ft}`.includes(` ${tk}`)) sc += 12;
      else if (it.ft.includes(tk)) sc += 6;
      else { sc += 2; todosEnTitulo = false; }
    }
    if (todosEnTitulo) sc += 15;
    if (it.y === 'c') sc += 8; // a igualdad, la categoría antes que sus subcategorías
    return sc - it.t.length * 0.05;
  };

  const buscar = (q: string) => {
    const tokens = fold(q).trim().split(/\s+/).filter(Boolean);
    if (!tokens.length || !indice) return null;
    const frase = tokens.join(' ');
    const ok = (it: Item) => tokens.every((tk) => (tk.length < 2 ? ` ${it.fh}`.includes(` ${tk}`) : it.fh.includes(tk)));
    const hallados = indice.filter(ok).map((it) => ({ it, sc: puntuar(it, tokens, frase) })).sort((a, b) => b.sc - a.sc).map((x) => x.it);
    return {
      tokens,
      catalogo: hallados.filter((i) => i.y === 'c' || i.y === 's').slice(0, 6),
      productos: hallados.filter((i) => i.y === 'p').slice(0, 8),
      guias: hallados.filter((i) => i.y === 'b').slice(0, 3),
    };
  };

  // ── Pintado ─────────────────────────────────────────────────
  const resaltar = (texto: string, tokens: string[]) => {
    const f = fold(texto);
    const rangos: [number, number][] = [];
    for (const tk of tokens) {
      const i = f.indexOf(tk);
      if (i >= 0) rangos.push([i, i + tk.length]);
    }
    rangos.sort((a, b) => a[0] - b[0]);
    const unidos: [number, number][] = [];
    for (const r of rangos) {
      const ult = unidos[unidos.length - 1];
      if (ult && r[0] <= ult[1]) ult[1] = Math.max(ult[1], r[1]);
      else unidos.push([...r]);
    }
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const [a, b] of unidos) {
      if (a > pos) frag.append(texto.slice(pos, a));
      const m = document.createElement('mark');
      m.textContent = texto.slice(a, b);
      frag.append(m);
      pos = b;
    }
    if (pos < texto.length) frag.append(texto.slice(pos));
    return frag;
  };

  const ICONO: Record<string, string> = {
    c: '<path d="M4 5h16v4H4zM4 11h7v8H4zM13 11h7v3h-7zM13 16h7v3h-7z"/>',
    s: '<path d="M4 7h16M4 12h10M4 17h6"/>',
    b: '<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/>',
    p: '<path d="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8"/>',
  };

  let enlaces: HTMLAnchorElement[] = [];
  let sel = -1;
  let n = 0;

  const marcar = (i: number) => {
    enlaces.forEach((a, j) => {
      const activo = j === i;
      a.setAttribute('aria-selected', String(activo));
      a.classList.toggle('bq-sel', activo);
    });
    sel = i;
    const a = enlaces[i];
    if (a) {
      input.setAttribute('aria-activedescendant', a.id);
      a.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };

  const grupo = (titulo: string, items: Item[], tokens: string[]) => {
    if (!items.length) return;
    const h = document.createElement('li');
    h.className = 'bq-grupo';
    h.setAttribute('role', 'presentation');
    h.textContent = titulo;
    lista.append(h);
    for (const it of items) {
      const li = document.createElement('li');
      li.setAttribute('role', 'presentation');
      const a = document.createElement('a');
      a.href = it.u;
      a.id = `bq-${n++}`;
      a.className = `bq-item bq-${it.y}`;
      a.setAttribute('role', 'option');
      a.setAttribute('aria-selected', 'false');
      const ic = document.createElement('span');
      ic.className = 'bq-ico';
      ic.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONO[it.y]}</svg>`;
      a.append(ic);
      const txt = document.createElement('span');
      txt.className = 'bq-txt';
      const t = document.createElement('span');
      t.className = 'bq-t';
      t.append(resaltar(it.t, tokens));
      txt.append(t);
      if (it.s || it.p) {
        const s = document.createElement('span');
        s.className = 'bq-s';
        s.textContent = [it.s, it.p].filter(Boolean).join(' · ');
        txt.append(s);
      }
      a.append(txt);
      li.append(a);
      lista.append(li);
      enlaces.push(a);
    }
  };

  let temporizador: number | undefined;
  const pintar = () => {
    lista.replaceChildren();
    enlaces = []; n = 0;
    const q = input.value;
    if (!indice) { estado.textContent = T.cargando; lista.innerHTML = `<li class="bq-vacio">${T.cargando}</li>`; return; }
    const r = buscar(q);
    if (!r) {
      // Sin texto: acceso directo a las categorías
      grupo(T.explora, indice.filter((i) => i.y === 'c'), []);
      estado.textContent = '';
      marcar(-1);
      return;
    }
    grupo(T.catalogo, r.catalogo, r.tokens);
    grupo(T.productos, r.productos, r.tokens);
    grupo(T.guias, r.guias, r.tokens);
    const total = r.catalogo.length + r.productos.length + r.guias.length;
    estado.textContent = total ? T.n(total) : '';
    if (!total) {
      const v = document.createElement('li');
      v.className = 'bq-vacio';
      v.textContent = T.nada(q.trim());
      lista.append(v);
      grupo(T.explora, indice.filter((i) => i.y === 'c'), []);
    }
    marcar(total ? 0 : -1);
    // Para las campañas: qué se busca y qué no se encuentra (GTM / GA4)
    window.clearTimeout(temporizador);
    if (q.trim().length >= 2) {
      temporizador = window.setTimeout(() => dl({ event: total ? 'site_search' : 'site_search_no_results', search_term: q.trim(), results: total }), 900);
    }
  };

  // ── Abrir / cerrar ──────────────────────────────────────────
  const abrir = () => {
    if (dlg.open) return;
    dlg.showModal();
    input.focus();
    pintar();
    cargar().then(pintar);
  };
  const cerrar = () => dlg.open && dlg.close();

  abridores.forEach((b) => {
    b.hidden = false; // sin JavaScript la lupa no se muestra
    b.addEventListener('click', abrir);
    b.addEventListener('pointerenter', () => { cargar(); }, { once: true });
    b.addEventListener('focus', () => { cargar(); }, { once: true });
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) cerrar(); }); // clic en el fondo oscuro
  dlg.querySelectorAll('[data-cerrar]').forEach((b) => b.addEventListener('click', cerrar));
  dlg.addEventListener('close', () => { input.value = ''; lista.replaceChildren(); enlaces = []; sel = -1; });

  input.addEventListener('input', pintar);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && enlaces.length) { e.preventDefault(); marcar((sel + 1) % enlaces.length); }
    else if (e.key === 'ArrowUp' && enlaces.length) { e.preventDefault(); marcar((sel - 1 + enlaces.length) % enlaces.length); }
    else if (e.key === 'Enter') {
      const a = enlaces[sel] ?? enlaces[0];
      if (a) {
        e.preventDefault();
        dl({ event: 'site_search_select', search_term: input.value.trim(), destino: a.getAttribute('href') });
        location.href = a.href;
      }
    }
  });
  lista.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (a) dl({ event: 'site_search_select', search_term: input.value.trim(), destino: a.getAttribute('href') });
  });
  lista.addEventListener('pointermove', (e) => {
    const a = (e.target as HTMLElement).closest('a') as HTMLAnchorElement | null;
    const i = a ? enlaces.indexOf(a) : -1;
    if (i >= 0 && i !== sel) marcar(i);
  });

  document.addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement | null;
    const escribiendo = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); abrir(); }
    else if (e.key === '/' && !escribiendo && !dlg.open) { e.preventDefault(); abrir(); }
  });
}
