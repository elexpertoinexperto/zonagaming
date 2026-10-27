// /buscar-es.json y /buscar-en.json: índice del buscador de la cabecera (ver src/lib/buscador-indice.ts)
import { indiceBusqueda } from '../lib/buscador-indice';

export function getStaticPaths() {
  return [{ params: { lang: 'es' } }, { params: { lang: 'en' } }];
}

export function GET({ params }: { params: { lang: 'es' | 'en' } }) {
  return new Response(JSON.stringify(indiceBusqueda(params.lang)), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
