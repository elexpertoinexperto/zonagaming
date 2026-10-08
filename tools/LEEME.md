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
     Rechaza miniaturas (<6 KB), logos y la misma imagen repetida en dos productos.
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
