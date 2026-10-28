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
- Formato (igual que eljoseoweb.com): cada `<url>` lleva solo `<loc>` y `<lastmod>`; el hreflang va en el `<head>` de cada página
  (`SiteLayout.astro`), no en el sitemap. Las URLs van escapadas para XML y los archivos se sirven como
  `application/xml; charset=utf-8` (`public/_headers`). Validación contra los XSD oficiales de sitemaps.org:
  `npm i --no-save xmllint-wasm && node tools/validar-sitemaps-xsd.mjs`.
- **lastmod real** (ISO 8601 UTC con «Z», p. ej. `2026-10-13T19:40:50.000Z`): sale de `src/data/sitemap-lastmod.json`, que mantiene
  `tools/actualizar-lastmod.mjs`. De cada URL (por idioma) guarda una huella de lo que muestra su página (su archivo `.astro` y/o su
  registro de producto, o los productos de su subcategoría; ver `src/lib/sitemap-entradas.mjs`). Si la huella cambia → fecha de ahora;
  si no → se conserva. El índice toma, para cada sitemap, la fecha de su URL más reciente.
  Se ejecuta solo en cada `npm run build` (script `prebuild`) y en cada commit (hook: `npm run hooks:install`, una vez por clon;
  el hook deja el JSON dentro del commit). Manual: `npm run lastmod` · `--check` (solo comprobar) · `--todo` (fecha de hoy a todo).
  Los cambios de plantilla compartida (cabecera, estilos…) NO cambian fechas: solo el contenido propio de cada URL.

## Blog (`BlogPost.astro`, `BlogIndex.astro`, `PostBuy.astro`)

- Los 19 artículos en español y los 19 en inglés usan la misma plantilla `BlogPost.astro` (cabecera editorial, índice lateral
  que sigue la lectura y desplegable en móvil, barra de progreso, tabla/lista/pasos/nota con estilo de marca, CTA final y
  "Sigue leyendo"). En los artículos la cabecera del sitio NO es pegajosa (clase `page-article`, solo cuando hay `article`).
- Un artículo nuevo = un archivo en `src/pages/blog/` y otro en `src/pages/en/blog/` con las constantes (`title`, `description`,
  `fecha`, `dateISO`, `tiempoLectura`, `secciones`) y el contenido como `<section id="…">` dentro de `<BlogPost …>`.
  Añádelo también a `src/data/blog-es.ts` (ES) y a `ARTICLES_EN` en `src/i18n/en.ts` (EN) para que salga en la portada del blog.
- `PostBuy` es el bloque "siguiente paso": enlaza a subcategorías del catálogo (`items={[{ cat, filtro, nota? }]}`; `filtro` es el
  slug en español). Si la subcategoría no existe, el build falla. REGLA: solo tras secciones donde la persona ya decide qué
  comprar (recomendaciones, "¿cuál elegir?", conclusión de una guía de compra), nunca en secciones puramente informativas.
- Prueba: `npm run build && node tools/probar-blog.mjs` (plantilla, enlaces internos, índice, bloques de compra, paridad ES/EN).

## Contenido de las categorías (ES y EN)

- Orden en cada categoría: guía de compra → **errores comunes** → más vendidos → **categorías relacionadas** → preguntas frecuentes.
- Errores comunes: `src/data/errores-comunes.ts` (5 por categoría, ES y EN) · componente `ErroresComunes.astro`.
- Categorías relacionadas (3 por categoría, con el porqué): `src/data/relaciones.ts` · `CategoriasRelacionadas.astro` (también al final de cada subcategoría).
- Enlazado interno automático: `EnlazadoInterno.astro` envuelve la guía, los errores y las preguntas frecuentes y enlaza la primera mención de otra
  categoría (máx. 3 por bloque; no títulos, negritas ni enlaces existentes). Para ampliar los términos: `TERMINOS_ES/EN` en ese archivo.
- Preguntas frecuentes: `src/data/faq.ts` (`faqEs`/`faqEn`), ya son propias de cada categoría (5 por categoría).

## Análisis automático de fichas y subcategorías (contenido propio por URL)

- **Ficha de producto** (`AnalisisProducto.astro` + `src/lib/analisis.mjs`): veredicto, posición por precio, pros y contras, para quién es,
  comparación con el producto inmediatamente más barato y más caro (con enlace y diferencias reales de ficha) y 2 preguntas frecuentes con schema FAQPage.
  Todo sale de las especificaciones y el precio del producto: no hay texto repetido entre productos. Reglas por categoría en `REGLAS` (ES y EN en la misma función).
- **Subcategoría** (`AnalisisSubcategoria.astro`): resumen del mercado (rango, mediana, marcas), 3 opciones destacadas, tabla comparativa de todos sus
  productos y 3 preguntas frecuentes con schema FAQPage. Los datos son de ESA selección.
- Un producto o categoría nueva funciona sin tocar nada; para una categoría con reglas nuevas, añade su función en `REGLAS`.

## SEO por keyword (`src/data/seo-keywords.json` + `src/lib/seo-keywords.mjs`)

- Viene de la investigación de palabras clave por URL (Excel «mapa por URL»): por cada categoría y subcategoría con keywords de **volumen >10**
  (el 10 es el piso de Google Ads = «sin volumen real») hay una keyword principal, y secundarias/terciarias relevantes. Informe URL por URL, con las
  principales del Excel que se descartaron por no encajar (p. ej. «uninterruptible power supply»): `tools/seo-keywords-informe.csv`.
- **Categorías (24)**: title, H1, meta description, introducción y bloque de texto (`TextoSEO.astro`, con enlaces a sus subcategorías) escritos a mano en el JSON.
- **Subcategorías**: el JSON solo guarda keyword, H1 y secundarias/terciarias; title («H1 al mejor precio | Monckey Gamer», ≤62), meta (con nº de modelos y rango de
  precios reales), introducción y bloque de texto los construye `seo-keywords.mjs` en cada build → al añadir productos no hay nada que mantener.
- Una URL que no está en el JSON conserva su SEO de siempre (las 60 sin keyword con volumen). Para cambiar una keyword o un H1: editar su entrada en el JSON.

## Buscador (lupa de la cabecera)

- La lupa (`Header.astro`) abre un diálogo nativo `<dialog>` con el buscador (`src/scripts/buscador.ts`). Atajos: `/` o Ctrl/Cmd+K; ↑ ↓ Enter Esc.
- **Prioridad de resultados**: 1.º Catálogo (categorías y subcategorías) · 2.º Productos concretos · 3.º Guías del blog. Sin texto muestra las categorías.
  Sin tildes ni mayúsculas; todas las palabras deben aparecer (título, marca, especificaciones o keywords del SEO).
- El índice (`/buscar-es.json` y `/buscar-en.json`, ~23 KB gzip cada uno) lo genera el build desde el catálogo real (`src/lib/buscador-indice.ts`):
  al añadir productos, subcategorías o artículos aparecen solos. Se descarga solo al abrir la lupa (o al pasar el ratón por ella). Sin imágenes a propósito.
- Para las campañas manda eventos a GTM/GA4: `site_search` (término + nº de resultados), `site_search_no_results` y `site_search_select` (destino).

## Auditoría de datos del catálogo (`tools/auditar-catalogo.mjs`)

- `npm run auditar` (sin red) revisa los 360 productos: ES y EN con los mismos ids/precios/ASIN/marca/imagen, sin duplicados, ASIN del enlace
  directo = ASIN de la ficha, nombre acorde a la ficha (VRAM, capacidad, DDR, potencia, radiador, Hz, peso…), sin español en la versión inglesa y sin «N/D» en
  las descripciones. Sale con error si algo falla: ejecútalo cada vez que añadas o cambies productos.
- `node tools/verificar-enlaces-amazon.mjs` (con red, ~1 min) comprueba que cada enlace corto `amzn.to` apunta al ASIN de su ficha (solo lee la redirección).
- Lo que NO se puede comprobar por código (especificaciones reales de cada modelo) se verificó a mano contra fuentes oficiales/retailers el 28-oct-2026;
  los precios son los de `precioFecha` y cambian en Amazon.
- El análisis de cada ficha (`src/lib/analisis.mjs`) trata «N/D», «Sin RGB», «Sin incluir» y «Sin micrófono» como AUSENCIA de dato: no los muestra como si fueran una característica.
