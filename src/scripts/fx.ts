// Efectos ligeros de la interfaz, sin librerías (inspirados en React Bits, con la paleta de Monckey Gamer).
// Todo se desactiva con prefers-reduced-motion y en pantallas táctiles cuando depende del cursor.
//  · Spotlight / Border Glow: la luz de las tarjetas sigue al cursor (variables CSS --mx / --my; el dibujo es CSS).
//  · Click Spark: chispas al hacer clic (menta, azul y naranja Amazon).
//  · Count Up: los números marcados con data-countup suben desde 0 cuando entran en pantalla.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ── Spotlight + Border Glow ─────────────────────────────────────────────
// La luz no salta al cursor: lo persigue con inercia (suavizado exponencial) y nace en el punto de entrada.
if (fine && !reduce) {
  const SEL = '.category-card, .product-card, .related-card';
  type S = { el: HTMLElement; tx: number; ty: number; cx: number; cy: number };
  const estado = new WeakMap<HTMLElement, S>();
  const activas = new Set<S>();
  let raf = 0;
  let prev = 0;

  const tick = (now: number) => {
    const dt = prev ? Math.min(now - prev, 50) : 16;
    prev = now;
    const k = 1 - Math.exp(-dt / 110); // ~110 ms de "arrastre"
    for (const s of activas) {
      s.cx += (s.tx - s.cx) * k;
      s.cy += (s.ty - s.cy) * k;
      s.el.style.setProperty('--mx', `${s.cx.toFixed(1)}px`);
      s.el.style.setProperty('--my', `${s.cy.toFixed(1)}px`);
      if (!s.el.matches(':hover') && Math.hypot(s.tx - s.cx, s.ty - s.cy) < 0.5) activas.delete(s);
    }
    if (activas.size) raf = requestAnimationFrame(tick);
    else { raf = 0; prev = 0; }
  };

  document.addEventListener('pointermove', (e) => {
    const card = (e.target as Element | null)?.closest?.(SEL) as HTMLElement | null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    let s = estado.get(card);
    if (!s) { s = { el: card, tx: x, ty: y, cx: x, cy: y }; estado.set(card, s); }
    if (!activas.has(s)) { s.cx = x; s.cy = y; activas.add(s); } // al entrar, la luz nace bajo el cursor
    s.tx = x; s.ty = y;
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: true });
}

// ── Click Spark ─────────────────────────────────────────────────────────
if (!reduce) {
  const COLORS = ['#7cffcb', '#1bb7ff', '#e6fff6', '#ff9900'];
  document.addEventListener('pointerdown', (e) => {
    const t = e.target as Element | null;
    if (t?.closest?.('input, select, textarea, [contenteditable]')) return;
    for (let i = 0; i < 9; i++) {
      const ang = (Math.PI * 2 * i) / 9 + Math.random() * 0.5;
      const dist = 18 + Math.random() * 20;
      const s = document.createElement('span');
      s.className = 'fx-spark';
      s.style.left = `${e.clientX}px`;
      s.style.top = `${e.clientY}px`;
      s.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(s);
      const rot = `rotate(${(ang * 180) / Math.PI + 90}deg)`;
      s.animate(
        [
          { transform: `translate(-50%, -50%) translate(0, 0) ${rot} scaleY(1)`, opacity: 1 },
          { transform: `translate(-50%, -50%) translate(${Math.cos(ang) * dist}px, ${Math.sin(ang) * dist}px) ${rot} scaleY(0.3)`, opacity: 0 },
        ],
        { duration: 480, easing: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
      ).onfinish = () => s.remove();
    }
  }, { passive: true });
}

// ── Count Up ────────────────────────────────────────────────────────────
// El HTML ya trae el número final (lo leen buscadores y quien no tenga JavaScript); aquí solo se anima al entrar en pantalla.
const nums = document.querySelectorAll<HTMLElement>('[data-countup]');
if (nums.length && !reduce && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      io.unobserve(en.target);
      const el = en.target as HTMLElement;
      const m = (el.textContent ?? '').match(/^(\D*)(\d+)(\D*)$/);
      if (!m) continue;
      const [, pre, n, suf] = m;
      const total = Number(n);
      el.style.display = 'inline-block';
      el.style.minWidth = `${el.offsetWidth}px`; // reserva el ancho final: sin saltos de diseño
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 1100);
        const v = Math.round(total * (1 - Math.pow(1 - k, 3)));
        el.textContent = `${pre}${v}${suf}`;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  nums.forEach((n) => io.observe(n));
}
