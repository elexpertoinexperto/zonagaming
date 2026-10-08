# Herramientas del catálogo

Todo se ejecuta desde la raíz del proyecto (`D:\Proyecto Astro\zona-gaming`).

## Cuando añades productos nuevos a `productos.json` / `productos-en.json`

1. **Comprobar el recomendador y las guías de juegos**
   ```
   node tools/probar-recomendador.mjs
   ```
   Si un producto de GPU, CPU o RAM no se reconoce, falla con el nombre exacto y te dice que lo añadas a
   las tablas de `src/lib/rendimiento.mjs` (puntos de rendimiento). Sin ese paso el build también falla,
   así nunca queda un producto fuera del recomendador en silencio.

2. **Imágenes oficiales del fabricante**
   - Pon la página oficial del producto en `tools/image-manifest.json` (`{ "categoria": { "id": "url" } }`)
     o prueba candidatas con `node tools/probar-urls.mjs lote.json` (verifica que la página responda y tenga
     una og:image propia; las que fallan quedan en `tools/probar-urls-fallos.json`).
   - `node tools/descargar-imagenes.mjs` baja las imágenes con pausas de 4 a 10 s entre peticiones.
     Rechaza miniaturas (<6 KB), logos y la misma imagen repetida en dos productos, y guarda todo como WebP de máx. 900 px (si ya hay imágenes pesadas: `node tools/optimizar-imagenes.mjs`).
   - Si una imagen bajó mal: `node tools/quitar-imagen.mjs categoria/id` la revierte al placeholder.
   - Si un sitio responde 429, sube la pausa: `PAUSA=20 node tools/probar-urls.mjs lote.json`.
   - Intel (ark.intel.com / intel.com) bloquea las descargas automáticas (403): esas se dejan sin imagen o se
     ponen a mano.

## Cómo funciona el recomendador (`src/lib/rendimiento.mjs`)

- Cada GPU, CPU y RAM tiene un índice de rendimiento orientativo (RTX 5060 = 100).
- Cada juego de `src/data/juegos-index.json` declara lo que exige: `gpu` (índice para 1080p Alto ≈ 60 FPS),
  `cpu`, `ramGB`, `objetivo` (resolución y ajustes) y si es `aaa` / `esports`.
- Para cada juego se recomienda siempre **una GPU, un CPU y una RAM**: entre las piezas que cumplen la exigencia
  con holgura (+15 % GPU, +10 % CPU) sin pasarse de largo (hasta 2,5× la exigencia), la de mejor relación
  rendimiento/precio. La RAM es siempre compatible con el socket del CPU elegido (AM4→DDR4, AM5 y Core Ultra→DDR5,
  Intel 12.ª/14.ª gen→DDR4 o DDR5 según la placa).
- Las fichas de producto (`JuegosCompatibles.astro`) muestran hasta 3 juegos que ese producto puede mover y la
  pieza complementaria recomendada. Todo se calcula en el build: añadir productos no requiere escribir nada a mano.
- Los puntos son una guía, no benchmarks. Para un juego nuevo basta con añadir su entrada en `juegos-index.json`.

## Subcategorías (filtros) y su SEO (`src/lib/filtros.mjs`)

- Cada categoría tiene subcategorías que cuelgan de ella: `/tarjetas-graficas/para-1080p/` ↔ `/en/graphics-cards/for-1080p/`
  (resolución, VRAM, marca, serie, socket, capacidad, potencia, tamaño, precio…). Lista completa en `tools/FILTROS-URLS.md`
  (`node tools/listar-filtros.mjs` la regenera).
- Una subcategoría existe solo si tiene **3 o más productos** y no es toda la categoría: al añadir productos aparecen
  solas (con sitemap, hreflang, breadcrumbs y enlaces desde la categoría madre).
- Para añadir un filtro: una línea `F(grupo, 'etiqueta ES', 'label EN', (p) => condición, 'consejo ES', 'tip EN')` en
  `src/lib/filtros.mjs`. Si el slug automático no es bueno, envuélvelo con `S(F(...), 'slug-es', 'slug-en')`.
- Cada página tiene su title/description únicos, H1, texto con datos reales (rango de precios, más barato/más caro, marcas),
  `BreadcrumbList` + `CollectionPage/ItemList` en JSON-LD, Open Graph, y enlaza a su madre y a sus hermanas.
- Prueba: `npm run build && node tools/probar-filtros.mjs` (hreflang, sitemap, canonical, H1, JSON-LD, enlaces madre↔hija, unicidad).

## Sitemaps (`src/lib/sitemap-data.ts`)

- `/sitemap.xml` (índice) → 6 sitemaps, cada uno en español e inglés: `sitemap-pages-es/en.xml` (inicio, recomendador, contacto,
  categorías y subcategorías), `sitemap-product-es/en.xml` (solo fichas de producto) y `sitemap-blog-es/en.xml` (solo `/blog/` y
  `/en/blog/`). Los nombres antiguos `sitemap-es.xml` y `sitemap-en.xml` redirigen (301) a `sitemap-pages-*` desde `public/_redirects`.
- Todo se descubre solo: los artículos del blog son los archivos de `src/pages/blog/*.astro` (el build avisa si uno no tiene
  versión en inglés), y las fichas y subcategorías salen de `productos.json`. No hay listas que mantener a mano.
- Prueba: `npm run build && node tools/probar-sitemaps.mjs` (toda página en un sitemap, ninguna repetida ni rota, blog solo
  en los sitemaps del blog, hreflang a páginas reales, canonical y noindex).
