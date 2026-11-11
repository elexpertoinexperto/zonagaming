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
   - **Después de descargar o cambiar fotos**: `node tools/optimizar-fotos-producto.mjs` (idempotente) pasa a WebP (máx. 900 px, con transparencia) cualquier foto local que no lo sea, reduce las WebP de
     más de 900 px o 150 KB y crea la versión de 480 px (`nombre-480.webp`) de las anchas, anotándola en `src/data/imagenes-variantes.json`; `ProductCard` la usa en `srcset`/`sizes`.
     `--simular` solo cuenta; `--verificar` comprueba sin escribir (todas WebP/SVG ligeras, con su variante y manifiesto al día).
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

## Idioma de las páginas (`src/lib/idioma.mjs`)

- Español = **es** (genérico, toda Latinoamérica) e inglés = **en-US** (Estados Unidos), igual que el hreflang y `og:locale`: `<html lang>` (SiteLayout y las dos portadas) y el `inLanguage` del JSON-LD usan `codigoIdioma(lang)`.
- `node tools/auditar-idioma.mjs` (tras `npm run build`) revisa las 1.169 páginas: html lang, og:locale, inLanguage y que todos los hreflang sean es / en-US / x-default.

## Alt-text de las imágenes (`src/lib/alt-texto.mjs`)

- El alt de cada foto de producto = **keyword principal de su categoría (la del H1) + nombre del producto**, p. ej. «Tarjeta gráfica para PC ASUS Prime Radeon RX 9070 XT…»
  / «Gaming mouse Razer Basilisk V3…». Nunca «Imagen de…» / «Image of…». Si el nombre ya empieza por la keyword no se repite.
- La keyword de cada categoría (ES y EN) está en la tabla `KW` de `alt-texto.mjs`: si cambia el H1 principal de una categoría, se edita ahí.
  Lo usan `ProductCard` (la categoría sale del enlace a la ficha), `ProductoDetalle` (de la URL), `Comparador` y las portadas de juegos (`altJuego`).
- `node tools/auditar-alt.mjs` (tras `npm run build`) revisa TODAS las páginas: ningún «imagen de», ninguna `<img>` sin alt y cada foto de producto con su alt esperado.

## Carga de imágenes: eager / lazy (`ProductCard.astro`)

- Regla (web.dev, «Browser-level image lazy loading» y «Optimize LCP»): lo que se ve al abrir la página va **eager**, el resto **lazy**, y la imagen LCP lleva `fetchpriority="high"` (solo 1–2 por página).
- El HTML no puede distinguir móvil de escritorio. Se usa la primera fila de escritorio: las **4 primeras tarjetas** de cada listado (categorías, subcategorías, Black Friday) son eager
  (`PRIMERA_FILA` en `ProductCard.astro`, que recibe `pos`); en móvil solo asoma la 1.ª, pero las 2.ª–3.ª están dentro de la distancia de precarga del navegador, así que eager no les cuesta más.
- Ficha de producto: foto principal `loading="eager" fetchpriority="high"`. Recomendador: 5 primeras portadas eager. «Más vendidos» de la portada y logo del pie: lazy (están bajo el pliegue).
- `node tools/auditar-carga-imagenes.mjs` (tras `npm run build`) lo comprueba en las 1.100+ páginas. Si cambian las columnas del listado, se ajusta `PRIMERA_FILA` y el número de la herramienta.

## Auditoría de datos del catálogo (`tools/auditar-catalogo.mjs`)

- `npm run auditar` (sin red) revisa los 360 productos: ES y EN con los mismos ids/precios/ASIN/marca/imagen, sin duplicados, ASIN del enlace
  directo = ASIN de la ficha, nombre acorde a la ficha (VRAM, capacidad, DDR, potencia, radiador, Hz, peso…), sin español en la versión inglesa y sin «N/D» en
  las descripciones. Sale con error si algo falla: ejecútalo cada vez que añadas o cambies productos.
- `node tools/verificar-enlaces-amazon.mjs` (con red, ~1 min) comprueba que cada enlace corto `amzn.to` apunta al ASIN de su ficha (solo lee la redirección).
- Lo que NO se puede comprobar por código (especificaciones reales de cada modelo) se verificó a mano contra fuentes oficiales/retailers el 28-oct-2026;
  los precios son los de `precioFecha` y cambian en Amazon.
- El análisis de cada ficha (`src/lib/analisis.mjs`) trata «N/D», «Sin RGB», «Sin incluir» y «Sin micrófono» como AUSENCIA de dato: no los muestra como si fueran una característica.

### Qué cuenta como «contenido» de una URL en el sitemap (revisado 29-oct-2026)

- **Ficha**: su archivo `[id].astro`, su registro de producto (cada idioma) y su **análisis** (`analisis.mjs`; depende de toda la categoría: si cambia el precio de un vecino, cambia la fecha).
- **Subcategoría**: su definición de filtro, sus productos, su entrada de SEO por keyword (`seo-keywords.json`) y los bloques de su categoría en `relaciones.ts` y `errores-comunes.ts`.
- **Categoría**: su `index.astro`, FAQ, su SEO por keyword, `relaciones.ts`, `errores-comunes.ts` y sus productos.
- NO cuentan (a propósito): cabecera, pie, estilos, buscador y efectos. Si cambias el TEXTO de `AnalisisSubcategoria.astro` o `FiltroPagina.astro`, esas 352 páginas cambian de contenido pero no de huella: ejecuta `node tools/actualizar-lastmod.mjs --todo` solo si de verdad quieres fecharlas.
- Al cambiar qué cuenta como contenido, usa `node tools/actualizar-lastmod.mjs --adoptar` (guarda las huellas nuevas SIN mover fechas) y corrige a mano las fechas con la del commit real.

### Cómo se garantiza que el sitemap nunca se quede atrasado (29-oct-2026)

Tres capas, todas automáticas en cada commit (hook `pre-commit`, instalado con `npm run hooks:install`; ya está en este clon):
1. **Huella por fuentes** (`sitemap-entradas.mjs`): fecha de cada URL según su registro, su archivo de página, su análisis, su SEO por keyword…
2. **Red de seguridad por contenido renderizado** (`--render`, `tools/huella-render.mjs`): el hook compila el sitio (~6 s) y compara lo que MUESTRA cada
   página (cuerpo sin cabecera/pie, title, meta description, robots, canonical y JSON-LD) con lo guardado en `src/data/sitemap-render.json`. Si cambió y
   su fecha no se movió, se mueve. Atrapa cualquier cambio visible aunque nadie declarara de qué dependía la página (p. ej. un artículo del blog que lista productos).
3. **Fecha del archivo sitemap en el índice** (`_sitemaps` en el manifiesto): según sitemaps.org y Google, el `<lastmod>` de cada sitemap en `sitemap.xml` es la fecha
   en que se modificó ESE archivo. Se guarda una huella de la lista (URL + fecha) de cada uno de los 6; si cambia —se añade, se quita o se refecha una URL— el sitemap y
   su entrada del índice se fechan «ahora». Prueba: `node tools/probar-sitemaps.mjs`.
- **Auditoría de toda la historia:** `npm run build && node tools/auditar-lastmod-historial.mjs` compila cada commit desde el 13-oct y comprueba que toda página cuyo
  contenido cambió tiene hoy un lastmod posterior al commit anterior (sale con error si no). Resultado a 29-oct-2026: 0 páginas atrasadas.
- Si se hace un cambio masivo y NO quieres refechar nada: `node tools/actualizar-lastmod.mjs --render --render-base` (guarda las huellas sin mover fechas).

## Comparador (casilla «Comparar» + /comparar/) — 11-nov-2026

- Cada tarjeta (`ProductCard.astro`) trae la casilla «Comparar»; al marcarla sale la bandeja fija (`CompareTray.astro`, en el pie) con hasta 4 productos de la
  MISMA categoría y el botón «Comparar», que abre `/comparar/?c=<categoria>&ids=1,2,3` (EN: `/en/compare/`). Lógica: `src/scripts/comparar.ts`.
- La página (`ComparePage.astro`) pinta la tabla en el navegador con `/datos/comparar-<categoria>-<idioma>.json` (`src/pages/datos/[archivo].json.ts`, generado en el build):
  precio y fecha, rendimiento y gama (gráficas/procesadores) y todas las especificaciones; «ver solo las diferencias»; quitar o añadir productos.
- Es una sola página por idioma: va en `noindex, follow` y fuera del sitemap (excepción en `probar-sitemaps.mjs`). Sin enlaces de Amazon: solo «Detalles».
- El comparador antiguo de dos huecos (`Comparador.astro`) ya solo está en la portada; salió de las 24 categorías (≈160 KB menos por página).
- El nombre del producto en las tarjetas es un enlace a la ficha (h2 > a). Filtro de gráficas «Fabricante del chipset»: NVIDIA, AMD e Intel (Intel con `min: 2`).
