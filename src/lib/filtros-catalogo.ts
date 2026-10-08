// Filtros (subcategorías) ya calculados con el catálogo real. Lo usan las rutas, el layout (hreflang),
// los sitemaps y la navegación. La lógica está en filtros.mjs.
import productos from '../data/productos.json';
import productosEn from '../data/productos-en.json';
import { construirFiltros, mapasDeSlugs, NOMBRES, GRUPOS, marcaNorm } from './filtros.mjs';

export type Filtro = {
  cat: string; grupo: string; es: string; en: string; slugEs: string; slugEn: string;
  tipEs: string; tipEn: string; ids: number[]; total: number; min: number; max: number; marcas: string[];
};

export const FILTROS: Record<string, Filtro[]> = construirFiltros(productos as any);
export const { esAEn: FILTRO_ES_A_EN, enAEs: FILTRO_EN_A_ES } = mapasDeSlugs(FILTROS);
export { NOMBRES, GRUPOS, marcaNorm };

// Productos de un filtro (en el idioma pedido; los ids son los mismos en ES y EN)
export function productosDelFiltro(f: Filtro, lang: 'es' | 'en') {
  const lista = ((lang === 'en' ? productosEn : productos) as any)[f.cat] as any[];
  return f.ids.map((id) => lista.find((p) => p.id === id)).filter(Boolean);
}

// Texto del filtro en un idioma
export const etiqueta = (f: Filtro, lang: 'es' | 'en') => (lang === 'en' ? f.en : f.es);
export const slugDe = (f: Filtro, lang: 'es' | 'en') => (lang === 'en' ? f.slugEn : f.slugEs);

// H1 / título: "Tarjetas gráficas para 1080p" · "Graphics Cards for 1080p"
export function tituloFiltro(f: Filtro, lang: 'es' | 'en') {
  const n = (NOMBRES as any)[f.cat];
  return lang === 'en' ? `${n.enTit} ${f.en}` : `${n.esTit} ${f.es}`;
}

export function rutaFiltro(f: Filtro, lang: 'es' | 'en', slugCatEn: string) {
  return lang === 'en' ? `/en/${slugCatEn}/${f.slugEn}/` : `/${f.cat}/${f.slugEs}/`;
}
