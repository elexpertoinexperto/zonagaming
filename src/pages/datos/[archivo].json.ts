// /datos/comparar-<categoria>-<idioma>.json: los productos de una categoría para la página del comparador (src/scripts/comparar.ts).
// Se genera en el build desde el catálogo, así que un producto nuevo aparece solo. No lleva enlaces de Amazon: el único enlace de compra está en la ficha.
import productosEs from '../../data/productos.json';
import productosEn from '../../data/productos-en.json';
import { NOMBRES } from '../../lib/filtros.mjs';
import { puntuarGpu, puntuarCpu } from '../../lib/rendimiento.mjs';
import { nivelGpu } from '../../lib/gpu-nivel.mjs';
import { SLUG_EN } from '../../i18n/en';

const CATS = Object.keys(productosEs);

export function getStaticPaths() {
  return CATS.flatMap((cat) => (['es', 'en'] as const).map((lang) => ({ params: { archivo: `comparar-${cat}-${lang}` }, props: { cat, lang } })));
}

export function GET({ props }: { props: { cat: string; lang: 'es' | 'en' } }) {
  const { cat, lang } = props;
  const en = lang === 'en';
  const lista = ((en ? productosEn : productosEs) as any)[cat] as any[];
  const base = en ? `/en/${SLUG_EN[cat]}` : `/${cat}`;
  const items = lista.map((p) => {
    const es = (productosEs as any)[cat].find((x: any) => x.id === p.id) ?? p; // el índice de rendimiento lee la ficha en español
    const specs = Object.fromEntries(Object.entries(p.especificaciones ?? {}).filter(([, v]) => String(v).trim() && String(v).trim().toUpperCase() !== 'N/D').map(([k, v]) => [k, String(v)]));
    const extra: Record<string, unknown> = {};
    if (cat === 'tarjetas-graficas') { const n = nivelGpu(es); extra.pts = n.puntos; extra.nivel = n.clase.etiqueta[lang]; }
    if (cat === 'procesadores') extra.pts = puntuarCpu(es).puntos;
    return { id: p.id, n: p.nombre, m: p.marca || undefined, p: p.precio, f: p.precioFecha || undefined, img: p.imagenUrl, href: `${base}/${p.slug}-${p.id}/`, specs, ...extra };
  });
  return new Response(JSON.stringify({ cat, nombre: (NOMBRES as any)[cat][en ? 'enTit' : 'esTit'], base, items }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
