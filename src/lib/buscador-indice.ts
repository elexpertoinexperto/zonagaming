// Índice del buscador de la lupa (cabecera). Se genera en el build, uno por idioma, y el navegador solo lo descarga
// cuando alguien abre la lupa (src/scripts/buscador.ts). Todo sale del catálogo real: al añadir productos,
// subcategorías o artículos aparecen solos en la búsqueda.
//   y: tipo (c categoría · s subcategoría · p producto · b guía del blog)
//   t: título · u: URL · s: subtítulo · k: palabras clave extra para encontrarlo · p: precio
// Sin imágenes a propósito: las fotos del catálogo pesan ~900 px y no merecen la pena en una lista.
import productos from '../data/productos.json';
import productosEn from '../data/productos-en.json';
import { ARTICULOS_ES } from '../data/blog-es';
import { FILTROS, NOMBRES, tituloFiltro, rutaFiltro, productosDelFiltro } from './filtros-catalogo';
import { seoDe } from './seo-keywords.mjs';
import { SLUG_EN, CATS_EN, ARTICLES_EN } from '../i18n/en';

export type EntradaBusqueda = { y: 'c' | 's' | 'p' | 'b'; t: string; u: string; s?: string; k?: string; p?: string };

const unicos = (xs: (string | undefined)[]) => [...new Set(xs.filter(Boolean) as string[])];

export function indiceBusqueda(lang: 'es' | 'en'): EntradaBusqueda[] {
  const en = lang === 'en';
  const lista = (en ? productosEn : productos) as unknown as Record<string, any[]>;
  const out: EntradaBusqueda[] = [];

  for (const cat of Object.keys(lista)) {
    const n = (NOMBRES as any)[cat];
    const base = en ? `/en/${SLUG_EN[cat]}/` : `/${cat}/`;
    const nombreCat = en ? n.enTit : n.esTit;
    const prods = lista[cat];
    const seo = seoDe(base);

    // Catálogo: la categoría y sus subcategorías van primero en los resultados
    out.push({
      y: 'c', t: nombreCat, u: base, s: `${prods.length} ${en ? 'products' : 'productos'}`,
      k: unicos([seo?.kw, ...(seo?.sec ?? []), ...(seo?.ter ?? []), n.es, n.en, n.esTit, n.enTit, CATS_EN[cat]?.label]).join(' '),
    });
    for (const f of FILTROS[cat] ?? []) {
      const ruta = rutaFiltro(f, lang, SLUG_EN[cat]);
      const sf = seoDe(ruta);
      out.push({
        y: 's', t: tituloFiltro(f, lang), u: ruta, s: `${f.total} ${en ? 'products' : 'productos'}`,
        k: unicos([sf?.kw, ...(sf?.sec ?? []), ...(sf?.ter ?? []), f.es, f.en, ...f.marcas]).join(' '),
      });
    }

    // Productos concretos
    for (const p of prods) {
      out.push({
        y: 'p', t: p.nombre, u: `${base}${p.slug}-${p.id}/`, s: [p.marca, nombreCat].filter(Boolean).join(' · '),
        k: unicos([p.marca, ...Object.values(p.especificaciones ?? {}).map(String)]).join(' '),
        p: `$${Number(p.precio).toFixed(2)}`,
      });
    }
  }

  // Guías del blog
  for (const a of en ? ARTICLES_EN : ARTICULOS_ES) {
    out.push({ y: 'b', t: a.titulo, u: a.href, s: a.tag, k: `${a.resumen} ${a.tag}` });
  }
  return out;
}
