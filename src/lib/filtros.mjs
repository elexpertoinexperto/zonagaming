// Filtros / "subcategorías" del catálogo. Cada filtro es una página propia en español e inglés:
//   /tarjetas-graficas/para-1080p/   ↔   /en/graphics-cards/for-1080p/
// Todo se calcula a partir de productos.json: la página de un filtro existe solo si tiene al menos
// MIN_PRODUCTOS productos (y no es toda la categoría), así nunca hay páginas vacías o casi vacías.
// Al añadir productos, los filtros, sus páginas, sitemaps y enlaces hreflang se actualizan solos.
// Para añadir un filtro nuevo basta con una línea F(...) en la categoría que corresponda.
import { puntuarGpu, puntuarCpu, puntuarRam } from './rendimiento.mjs';

export const MIN_PRODUCTOS = 3;

// ───────────────────────── Utilidades ─────────────────────────
export const slugify = (s) =>
  String(s)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[$€]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const low = (s) => String(s ?? '').toLowerCase();
const num = (s) => parseFloat(String(s ?? '').replace(',', '.').match(/[\d.]+/)?.[0]) || 0;
const sp = (p, k) => p.especificaciones?.[k] ?? '';
const nombre = (p) => low(p.nombre);

// Marca normalizada (ASUS ROG → ASUS, CORSAIR → Corsair, WD → Western Digital…)
const ALIAS = { 'asus rog': 'ASUS', corsair: 'Corsair', gigabyte: 'Gigabyte', gigastone: 'Gigastone', wd: 'Western Digital',
  'western digital': 'Western Digital', teamgroup: 'TEAMGROUP', 'turtle beach': 'Turtle Beach', arctic: 'ARCTIC' };
export function marcaNorm(p) {
  const m = String(p.marca ?? '').trim();
  return ALIAS[low(m)] ?? m;
}

// ───────────────────────── Definición de filtros ─────────────────────────
// F(grupo, etiquetaES, etiquetaEN, test, consejoES, consejoEN)
const F = (grupo, es, en, test, tipEs = '', tipEn = '') => ({ grupo, es, en, test, tipEs, tipEn });
// Fija slugs concretos cuando el generado automáticamente no es bueno (p. ej. porcentajes)
const S = (def, es, en) => ({ ...def, slugEs: es, slugEn: en });
const marca = (m, esExtra = '', enExtra = '') => F('marca', m, m, (p) => marcaNorm(p) === m,
  `Todos los modelos ${esExtra}de ${m} que tenemos en catálogo, con precio y enlace directo a Amazon.`,
  `Every ${enExtra}${m} model in our catalog, with price and a direct Amazon link.`);
const menosDe = (usd, tipEs, tipEn) => F('precio', `por menos de $${usd}`, `under $${usd}`, (p) => p.precio < usd, tipEs, tipEn);
const masDe = (usd, tipEs, tipEn) => F('precio', `de más de $${usd}`, `over $${usd}`, (p) => p.precio >= usd, tipEs, tipEn);

// Nombres de la categoría (para títulos y textos)
export const NOMBRES = {
  'tarjetas-graficas': { es: 'tarjetas gráficas', en: 'graphics cards', esTit: 'Tarjetas gráficas', enTit: 'Graphics Cards', esUno: 'una tarjeta gráfica', enUno: 'a graphics card' },
  procesadores: { es: 'procesadores', en: 'processors', esTit: 'Procesadores', enTit: 'Processors', esUno: 'un procesador', enUno: 'a processor' },
  'memoria-ram': { es: 'memorias RAM', en: 'RAM memory kits', esTit: 'Memorias RAM', enTit: 'RAM Memory', esUno: 'una memoria RAM', enUno: 'a RAM kit' },
  ssd: { es: 'SSD', en: 'SSDs', esTit: 'SSD', enTit: 'SSDs', esUno: 'un SSD', enUno: 'an SSD' },
  'fuentes-de-poder': { es: 'fuentes de poder', en: 'power supplies', esTit: 'Fuentes de poder', enTit: 'Power Supplies', esUno: 'una fuente de poder', enUno: 'a power supply' },
  'refrigeracion-liquida': { es: 'refrigeraciones líquidas', en: 'liquid coolers', esTit: 'Refrigeración líquida', enTit: 'Liquid Cooling', esUno: 'una refrigeración líquida', enUno: 'a liquid cooler' },
  'refrigeracion-normal': { es: 'disipadores de aire', en: 'air coolers', esTit: 'Refrigeración por aire', enTit: 'Air Cooling', esUno: 'un disipador de aire', enUno: 'an air cooler' },
  'gabinetes-gamer': { es: 'gabinetes gamer', en: 'gaming cases', esTit: 'Gabinetes gamer', enTit: 'Gaming Cases', esUno: 'un gabinete gamer', enUno: 'a gaming case' },
  teclados: { es: 'teclados gamer', en: 'gaming keyboards', esTit: 'Teclados gamer', enTit: 'Gaming Keyboards', esUno: 'un teclado gamer', enUno: 'a gaming keyboard' },
  mouse: { es: 'mouse gamer', en: 'gaming mice', esTit: 'Mouse gamer', enTit: 'Gaming Mice', esUno: 'un mouse gamer', enUno: 'a gaming mouse' },
  audifonos: { es: 'audífonos gamer', en: 'gaming headsets', esTit: 'Audífonos gamer', enTit: 'Gaming Headsets', esUno: 'unos audífonos gamer', enUno: 'a gaming headset' },
  monitores: { es: 'monitores gamer', en: 'gaming monitors', esTit: 'Monitores gamer', enTit: 'Gaming Monitors', esUno: 'un monitor gamer', enUno: 'a gaming monitor' },
};

// Etiquetas de los grupos de filtros (para las filas de chips)
export const GRUPOS = {
  resolucion: { es: 'Resolución', en: 'Resolution' },
  vram: { es: 'Memoria de video', en: 'Video memory' },
  chip: { es: 'Fabricante del chip', en: 'Chip maker' },
  modelo: { es: 'Modelo', en: 'Model' },
  serie: { es: 'Serie', en: 'Series' },
  socket: { es: 'Plataforma', en: 'Platform' },
  nucleos: { es: 'Núcleos', en: 'Cores' },
  tipo: { es: 'Tipo', en: 'Type' },
  capacidad: { es: 'Capacidad', en: 'Capacity' },
  velocidad: { es: 'Velocidad', en: 'Speed' },
  potencia: { es: 'Potencia', en: 'Wattage' },
  certificacion: { es: 'Eficiencia', en: 'Efficiency' },
  caracteristicas: { es: 'Características', en: 'Features' },
  tamano: { es: 'Tamaño y formato', en: 'Size & format' },
  panel: { es: 'Panel', en: 'Panel' },
  conexion: { es: 'Conexión', en: 'Connection' },
  color: { es: 'Color', en: 'Color' },
  marca: { es: 'Marca', en: 'Brand' },
  precio: { es: 'Precio (USD)', en: 'Price (USD)' },
};

const DEFINICIONES = {
  // ── Tarjetas gráficas ──────────────────────────────────────────────
  'tarjetas-graficas': (() => {
    const g = (p) => puntuarGpu(p);
    const chipDe = (p) => g(p).chip;
    return [
      F('resolucion', 'para 1080p', 'for 1080p', (p) => g(p).puntos >= 45 && g(p).puntos <= 125,
        'Para jugar en Full HD no necesitas gastar de más: con 8 GB de VRAM mueves casi todo en alto. Estas son las opciones con mejor equilibrio para 1080p.',
        'You do not need to overspend for Full HD: 8 GB of VRAM runs almost everything on high. These are the best-balanced options for 1080p.'),
      F('resolucion', 'para 1440p', 'for 1440p', (p) => g(p).puntos >= 100 && g(p).vram >= 12,
        'Para 1440p (2K) conviene tener 12 GB de VRAM o más. Estas tarjetas mantienen buenos FPS en calidad alta y ultra sin quedarse cortas de memoria.',
        'For 1440p (2K) you want 12 GB of VRAM or more. These cards hold strong FPS on high and ultra without running out of memory.'),
      F('resolucion', 'para 4K', 'for 4K', (p) => g(p).puntos >= 170 && g(p).vram >= 16,
        'Jugar en 4K exige potencia y 16 GB de VRAM. Aquí están las tarjetas capaces de moverlo, normalmente apoyadas en DLSS o FSR.',
        '4K gaming demands raw power and 16 GB of VRAM. These are the cards that can handle it, usually helped by DLSS or FSR.'),
      F('vram', 'de 6 GB', 'with 6 GB', (p) => g(p).vram === 6, 'Con 6 GB de VRAM son tarjetas de entrada, pensadas para 1080p en calidad media o alta.', '6 GB cards are entry level, aimed at 1080p on medium to high settings.'),
      F('vram', 'de 8 GB', 'with 8 GB', (p) => g(p).vram === 8, 'Los 8 GB cubren 1080p sin problemas; en juegos recientes a 1440p pueden quedarse justos.', '8 GB covers 1080p comfortably; in recent games at 1440p it can get tight.'),
      F('vram', 'de 12 GB', 'with 12 GB', (p) => g(p).vram === 12, '12 GB de VRAM es el punto dulce para 1440p: margen de sobra para texturas en alta.', '12 GB of VRAM is the sweet spot for 1440p: plenty of room for high-res textures.'),
      F('vram', 'de 16 GB', 'with 16 GB', (p) => g(p).vram === 16, 'Con 16 GB de VRAM estás cubierto para 1440p ultra, 4K y juegos con texturas pesadas.', '16 GB of VRAM has you covered for 1440p ultra, 4K and texture-heavy games.'),
      F('chip', 'NVIDIA GeForce', 'NVIDIA GeForce', (p) => /geforce|rtx|gtx/i.test(p.nombre), 'Tarjetas con chip NVIDIA: DLSS, trazado de rayos maduro y gran soporte de drivers.', 'NVIDIA-powered cards: DLSS, mature ray tracing and great driver support.'),
      F('chip', 'AMD Radeon', 'AMD Radeon', (p) => /radeon|\brx\b/i.test(p.nombre), 'Tarjetas con chip AMD: gran rendimiento por dólar y FSR compatible con casi cualquier juego.', 'AMD-powered cards: strong value per dollar and FSR that works in nearly any game.'),
      F('modelo', 'RTX 5060', 'RTX 5060', (p) => chipDe(p) === 'RTX 5060', 'La RTX 5060 es la puerta de entrada a la serie 50: DLSS 4 y Frame Generation para 1080p y 1440p.', 'The RTX 5060 is the entry point to the 50 series: DLSS 4 and Frame Generation for 1080p and 1440p.'),
      F('modelo', 'RTX 5060 Ti', 'RTX 5060 Ti', (p) => chipDe(p) === 'RTX 5060 Ti', 'La RTX 5060 Ti, sobre todo en versión 16 GB, es muy recomendable para 1440p.', 'The RTX 5060 Ti, especially the 16 GB version, is a great pick for 1440p.'),
      F('modelo', 'RTX 5070', 'RTX 5070', (p) => chipDe(p) === 'RTX 5070', 'La RTX 5070 apunta a 1440p alto con trazado de rayos y DLSS 4.', 'The RTX 5070 targets high-refresh 1440p with ray tracing and DLSS 4.'),
      F('modelo', 'Radeon RX 9060 XT', 'Radeon RX 9060 XT', (p) => chipDe(p) === 'RX 9060 XT', 'La RX 9060 XT con 16 GB ofrece mucha VRAM y muy buen precio para 1440p.', 'The RX 9060 XT with 16 GB offers lots of VRAM and a great price for 1440p.'),
      F('modelo', 'Radeon RX 9070', 'Radeon RX 9070', (p) => /RX 9070/.test(chipDe(p)), 'La familia RX 9070 (incluye XT y GRE) compite en la gama alta con 1440p fluido y 4K con FSR 4.', 'The RX 9070 family (including XT and GRE) competes in the high end with smooth 1440p and 4K with FSR 4.'),
      marca('ASUS'), marca('Gigabyte'), marca('ASRock'),
      menosDe(200, 'Tarjetas gráficas baratas para equipos de bajo presupuesto, oficina con algo de gaming o juegos ligeros y esports.', 'Cheap graphics cards for budget builds, office PCs with light gaming or esports titles.'),
      menosDe(400, 'Buenas opciones por menos de $400 para jugar en 1080p con comodidad.', 'Good options under $400 for comfortable 1080p gaming.'),
      menosDe(600, 'Hasta $600 entran las mejores tarjetas para 1080p alto y muchas de 1440p.', 'Up to $600 you get the best 1080p cards and plenty of 1440p options.'),
      masDe(1000, 'Gama entusiasta: tarjetas pensadas para 4K, trazado de rayos y máximo rendimiento.', 'Enthusiast tier: cards built for 4K, ray tracing and maximum performance.'),
    ];
  })(),

  // ── Procesadores ───────────────────────────────────────────────────
  procesadores: (() => {
    const c = (p) => puntuarCpu(p);
    return [
      marca('AMD', 'Ryzen ', 'Ryzen '), marca('Intel', 'Core ', 'Core '),
      F('serie', 'Ryzen 5', 'Ryzen 5', (p) => /ryzen 5/i.test(p.nombre), 'Los Ryzen 5 de 6 núcleos son los más recomendados para gaming por precio y rendimiento.', 'The 6-core Ryzen 5 chips are the most recommended for gaming thanks to price and performance.'),
      F('serie', 'Ryzen 7', 'Ryzen 7', (p) => /ryzen 7/i.test(p.nombre), 'Los Ryzen 7 de 8 núcleos añaden margen para jugar y hacer streaming a la vez.', 'The 8-core Ryzen 7 chips add headroom to game and stream at the same time.'),
      F('serie', 'Ryzen 9', 'Ryzen 9', (p) => /ryzen 9/i.test(p.nombre), 'Los Ryzen 9 de 12 a 16 núcleos son ideales si además de jugar editas video o renderizas.', 'Ryzen 9 chips with 12 to 16 cores are ideal if you also edit video or render.'),
      F('serie', 'Core i5', 'Core i5', (p) => /core i5/i.test(p.nombre), 'Los Intel Core i5 ofrecen un gran rendimiento en juegos a precio contenido.', 'Intel Core i5 chips deliver great gaming performance at a reasonable price.'),
      F('serie', 'Core Ultra', 'Core Ultra', (p) => /core ultra/i.test(p.nombre), 'La nueva generación Intel Core Ultra (socket LGA1851) con soporte DDR5 y mejor eficiencia.', 'Intel\'s new Core Ultra generation (LGA1851 socket) with DDR5 support and better efficiency.'),
      F('socket', 'socket AM4', 'AM4 socket', (p) => c(p).plataforma === 'AM4', 'AM4 usa memoria DDR4: la plataforma más económica para armar un PC gamer sin gastar de más.', 'AM4 uses DDR4 memory: the most affordable platform for a gaming PC.'),
      F('socket', 'socket AM5', 'AM5 socket', (p) => c(p).plataforma === 'AM5', 'AM5 es la plataforma actual de AMD, con DDR5, PCIe 5.0 y soporte a largo plazo.', 'AM5 is AMD\'s current platform, with DDR5, PCIe 5.0 and long-term support.'),
      F('socket', 'socket LGA1700', 'LGA1700 socket', (p) => c(p).plataforma === 'LGA1700', 'LGA1700 (Intel 12.ª, 13.ª y 14.ª gen) acepta DDR4 o DDR5 según la placa madre.', 'LGA1700 (Intel 12th, 13th and 14th gen) accepts DDR4 or DDR5 depending on the motherboard.'),
      F('nucleos', 'de 6 núcleos', '6-core', (p) => c(p).nucleos === 6, 'Seis núcleos siguen siendo suficientes para jugar, a un precio muy bajo.', 'Six cores are still plenty for gaming, at a very low price.'),
      F('nucleos', 'de 8 núcleos', '8-core', (p) => c(p).nucleos === 8, 'Ocho núcleos son el punto dulce para jugar con margen y usar otras aplicaciones en paralelo.', 'Eight cores are the sweet spot for gaming with headroom and running other apps at once.'),
      F('nucleos', 'de 12 o más núcleos', 'with 12 or more cores', (p) => c(p).nucleos >= 12, 'Con 12 o más núcleos tienes potencia de sobra para streaming, edición y trabajo pesado.', 'With 12 or more cores you get plenty of power for streaming, editing and heavy workloads.'),
      menosDe(150, 'Procesadores baratos para armar un PC gamer económico.', 'Cheap processors for building a budget gaming PC.'),
      menosDe(250, 'Hasta $250 están los mejores procesadores para jugar en 1080p y 1440p.', 'Up to $250 you find the best CPUs for 1080p and 1440p gaming.'),
      masDe(400, 'Procesadores de gama alta para máximo rendimiento en juegos y trabajo profesional.', 'High-end processors for maximum gaming and professional performance.'),
    ];
  })(),

  // ── Memoria RAM ────────────────────────────────────────────────────
  'memoria-ram': (() => {
    const r = (p) => puntuarRam(p);
    return [
      F('tipo', 'DDR4', 'DDR4', (p) => r(p).tipo === 'DDR4', 'La memoria DDR4 es la más económica y compatible con Ryzen serie 5000 y muchos Intel de 12.ª a 14.ª generación.', 'DDR4 is the cheapest option and works with Ryzen 5000 and many Intel 12th to 14th gen systems.'),
      F('tipo', 'DDR5', 'DDR5', (p) => r(p).tipo === 'DDR5', 'La DDR5 es obligatoria en Ryzen 7000/9000 e Intel Core Ultra, y recomendable en equipos nuevos.', 'DDR5 is required on Ryzen 7000/9000 and Intel Core Ultra, and recommended for new builds.'),
      F('capacidad', 'de 16 GB', '16 GB', (p) => r(p).gb === 16, '16 GB siguen siendo suficientes para la mayoría de juegos en 1080p.', '16 GB is still enough for most 1080p games.'),
      F('capacidad', 'de 32 GB', '32 GB', (p) => r(p).gb === 32, '32 GB te da margen para juegos modernos, streaming y multitarea sin cuellos de botella.', '32 GB gives you room for modern games, streaming and multitasking without bottlenecks.'),
      F('tipo', 'DDR5 de 32 GB', 'DDR5 32 GB', (p) => r(p).tipo === 'DDR5' && r(p).gb === 32, 'El combo más buscado para equipos nuevos: 32 GB DDR5 en doble canal.', 'The most popular combo for new builds: 32 GB of DDR5 in dual channel.'),
      F('tipo', 'DDR4 de 16 GB', 'DDR4 16 GB', (p) => r(p).tipo === 'DDR4' && r(p).gb === 16, 'La mejora más barata para un PC con DDR4: 16 GB en dos módulos.', 'The cheapest upgrade for a DDR4 PC: 16 GB in two modules.'),
      F('velocidad', 'de 3200 MHz', '3200 MHz', (p) => r(p).mhz === 3200, 'DDR4 a 3200 MHz es el estándar de buena relación calidad-precio.', 'DDR4-3200 is the standard value pick.'),
      F('velocidad', 'de 3600 MHz', '3600 MHz', (p) => r(p).mhz === 3600, 'DDR4 a 3600 MHz es el punto dulce en Ryzen serie 5000.', 'DDR4-3600 is the sweet spot on Ryzen 5000.'),
      F('velocidad', 'de 6000 MHz', '6000 MHz', (p) => r(p).mhz === 6000, 'DDR5 a 6000 MHz es la velocidad ideal para Ryzen 7000/9000.', 'DDR5-6000 is the ideal speed for Ryzen 7000/9000.'),
      F('caracteristicas', 'con RGB', 'with RGB', (p) => /rgb/i.test(p.nombre), 'Memorias con iluminación RGB para lucir tu setup.', 'RAM with RGB lighting to show off your build.'),
      F('caracteristicas', 'compatibles con AMD EXPO', 'AMD EXPO compatible', (p) => /expo/i.test(sp(p, 'Compatibilidad') + p.nombre), 'Perfiles EXPO para activar la velocidad máxima con un clic en placas AMD.', 'EXPO profiles to unlock full speed in one click on AMD boards.'),
      F('caracteristicas', 'blancas', 'in white', (p) => /white|blanc/i.test(p.nombre + sp(p, 'Color')), 'Memorias blancas para combinar con builds claros.', 'White RAM to match light-colored builds.'),
      marca('Corsair'), marca('TEAMGROUP'), marca('OLOy'), marca('Gigastone'),
      menosDe(150, 'Kits de memoria económicos para renovar tu PC sin gastar de más.', 'Budget RAM kits to refresh your PC without overspending.'),
      menosDe(250, 'Buenas memorias hasta $250: DDR4 de 32 GB y kits de gama media.', 'Good RAM up to $250: 32 GB DDR4 and mid-range kits.'),
    ];
  })(),

  // ── SSD ────────────────────────────────────────────────────────────
  ssd: (() => {
    const gb = (p) => { const c = sp(p, 'Capacidad'); const v = num(c); return /tb/i.test(c) ? v * 1000 : v; };
    const nvme = (p) => /nvme/i.test(sp(p, 'Interfaz') + p.nombre);
    return [
      F('capacidad', 'de 500 GB y 512 GB', '500 GB and 512 GB', (p) => gb(p) >= 500 && gb(p) <= 512, 'Capacidad de entrada: ideal como unidad del sistema o para pocos juegos.', 'Entry capacity: ideal as a system drive or for a handful of games.'),
      F('capacidad', 'de 1 TB', '1 TB', (p) => gb(p) === 1000, '1 TB es el tamaño más popular: sistema, aplicaciones y varios juegos grandes.', '1 TB is the most popular size: OS, apps and several large games.'),
      F('capacidad', 'de 2 TB', '2 TB', (p) => gb(p) === 2000, '2 TB te permite tener decenas de juegos instalados a la vez sin borrar nada.', '2 TB lets you keep dozens of games installed at once.'),
      F('capacidad', 'de 4 TB', '4 TB', (p) => gb(p) === 4000, '4 TB para bibliotecas enormes, edición de video y proyectos pesados.', '4 TB for huge libraries, video editing and heavy projects.'),
      F('tipo', 'NVMe', 'NVMe', (p) => nvme(p), 'Los SSD NVMe M.2 son mucho más rápidos que los SATA: carga de juegos y sistema casi instantánea.', 'NVMe M.2 SSDs are far faster than SATA: near-instant game and system loading.'),
      F('tipo', 'SATA', 'SATA', (p) => /sata/i.test(sp(p, 'Interfaz')), 'Los SSD SATA de 2,5" son perfectos para actualizar equipos antiguos sin placa M.2.', '2.5" SATA SSDs are perfect for upgrading older PCs without an M.2 slot.'),
      F('tipo', 'PCIe 4.0', 'PCIe 4.0', (p) => /gen4|4\.0/i.test(sp(p, 'Interfaz')) && !/gen5|5\.0 x4|5\.0 nvme/i.test(sp(p, 'Interfaz')), 'PCIe 4.0 ofrece 5000 a 7400 MB/s: el mejor equilibrio entre velocidad y precio hoy.', 'PCIe 4.0 delivers 5,000 to 7,400 MB/s: the best balance of speed and price today.'),
      F('tipo', 'PCIe 5.0', 'PCIe 5.0', (p) => /gen5|5\.0 x4|5\.0 nvme/i.test(sp(p, 'Interfaz')), 'PCIe 5.0 alcanza más de 12 000 MB/s; necesita una placa compatible y buena refrigeración.', 'PCIe 5.0 reaches over 12,000 MB/s; it needs a compatible motherboard and good cooling.'),
      F('tipo', 'NVMe de 1 TB', 'NVMe 1 TB', (p) => nvme(p) && gb(p) === 1000, 'La combinación más buscada: velocidad NVMe y 1 TB de espacio.', 'The most searched combo: NVMe speed with 1 TB of space.'),
      F('tipo', 'NVMe de 2 TB', 'NVMe 2 TB', (p) => nvme(p) && gb(p) === 2000, 'NVMe de 2 TB: velocidad máxima y espacio de sobra para toda tu biblioteca.', 'NVMe 2 TB: top speed and plenty of room for your entire library.'),
      marca('Samsung'), marca('Crucial'), marca('Lexar'),
      menosDe(100, 'SSD baratos para renovar tu PC y notar la diferencia frente a un disco duro.', 'Cheap SSDs to refresh your PC and feel the difference over a hard drive.'),
      menosDe(200, 'SSD de gama media por menos de $200, incluyendo muchos NVMe de 1 TB.', 'Mid-range SSDs under $200, including many 1 TB NVMe drives.'),
    ];
  })(),

  // ── Fuentes de poder ───────────────────────────────────────────────
  'fuentes-de-poder': (() => {
    const w = (p) => num(sp(p, 'Potencia'));
    const cert = (p) => low(sp(p, 'Certificación'));
    return [
      F('potencia', 'de 650 W', '650 W', (p) => w(p) === 650, 'Una fuente de 650 W alcanza para equipos con GPU de gama media-baja y CPU eficiente.', 'A 650 W PSU is enough for mid-to-low-end GPUs and efficient CPUs.'),
      F('potencia', 'de 750 W', '750 W', (p) => w(p) === 750, '750 W es la potencia más recomendada para la mayoría de PC gamer con GPU de gama media-alta.', '750 W is the most recommended wattage for most gaming PCs with mid-to-high-end GPUs.'),
      F('potencia', 'de 850 W', '850 W', (p) => w(p) === 850, '850 W da margen para GPU de gama alta como RTX 5070 Ti o RX 9070 XT y para futuras mejoras.', '850 W gives headroom for high-end GPUs like the RTX 5070 Ti or RX 9070 XT and future upgrades.'),
      F('potencia', 'de 1000 W', '1000 W', (p) => w(p) === 1000, '1000 W para equipos extremos: RTX 5080, procesadores de alto consumo y overclock.', '1000 W for extreme builds: RTX 5080, power-hungry CPUs and overclocking.'),
      F('certificacion', '80 Plus Gold', '80 Plus Gold', (p) => /gold/i.test(cert(p)), '80 Plus Gold garantiza al menos 87-90 % de eficiencia: menos calor, menos ruido y menor consumo.', '80 Plus Gold guarantees at least 87-90% efficiency: less heat, less noise and lower power draw.'),
      F('certificacion', '80 Plus Bronze', '80 Plus Bronze', (p) => /bronze/i.test(cert(p)), 'Las fuentes Bronze son la opción más económica con certificación de eficiencia.', 'Bronze PSUs are the cheapest certified-efficiency option.'),
      F('caracteristicas', 'totalmente modulares', 'fully modular', (p) => /totalmente/i.test(sp(p, 'Modular')), 'Con cables desmontables solo conectas lo que usas: mejor orden y flujo de aire.', 'Detachable cables mean you only connect what you use: tidier build and better airflow.'),
      F('caracteristicas', 'ATX 3.1', 'ATX 3.1', (p) => /atx 3\.1/i.test(sp(p, 'Estándar') + p.nombre), 'ATX 3.1 y conector 12V-2x6 nativo: lo necesario para las RTX 50 y RX 9000 modernas.', 'ATX 3.1 with a native 12V-2x6 connector: what modern RTX 50 and RX 9000 cards need.'),
      F('color', 'blancas', 'white', (p) => /blanc|white|snow/i.test(p.nombre), 'Fuentes de poder blancas para builds claros.', 'White power supplies for light-colored builds.'),
      marca('ASRock'), marca('MSI'), marca('Corsair'),
      menosDe(70, 'Fuentes de poder baratas que cumplen con certificación y protecciones.', 'Cheap power supplies that still deliver certification and protections.'),
      menosDe(100, 'Fuentes 80 Plus Gold modulares por menos de $100.', '80 Plus Gold modular PSUs under $100.'),
    ];
  })(),

  // ── Refrigeración líquida ──────────────────────────────────────────
  'refrigeracion-liquida': (() => {
    const mm = (p) => num(sp(p, 'Radiador'));
    const pant = (p) => /pantalla|lcd|display|ips/i.test(sp(p, 'RGB') + p.nombre);
    return [
      F('tamano', 'de 240 mm', '240 mm', (p) => mm(p) === 240, 'Los AIO de 240 mm caben en casi cualquier gabinete y enfrían muy bien procesadores de gama media.', '240 mm AIOs fit almost any case and cool mid-range CPUs very well.'),
      F('tamano', 'de 360 mm', '360 mm', (p) => mm(p) === 360, 'Los AIO de 360 mm ofrecen la máxima superficie de radiador para procesadores potentes u overclock.', '360 mm AIOs give maximum radiator area for powerful CPUs or overclocking.'),
      F('caracteristicas', 'con pantalla', 'with display', (p) => pant(p), 'AIO con pantalla LCD o IPS en el bloque para mostrar temperaturas, GIF o imágenes.', 'AIOs with an LCD or IPS screen on the block to show temperatures, GIFs or images.'),
      F('caracteristicas', 'con ARGB', 'with ARGB', (p) => /argb|a-rgb/i.test(sp(p, 'RGB') + p.nombre), 'Iluminación ARGB direccionable, sincronizable con tu placa madre.', 'Addressable ARGB lighting that syncs with your motherboard.'),
      F('caracteristicas', 'sin RGB', 'without RGB', (p) => /sin rgb/i.test(sp(p, 'RGB') + p.nombre), 'Para quien prefiere un look discreto: rendimiento sin luces.', 'For a discreet look: performance without lights.'),
      F('color', 'blancas', 'white', (p) => /blanc|white/i.test(p.nombre), 'Refrigeraciones líquidas blancas para builds claros.', 'White liquid coolers for light-colored builds.'),
      marca('Thermalright'), marca('MSI'), marca('ARCTIC'),
      menosDe(50, 'AIO baratos que ya superan a muchos disipadores de aire.', 'Cheap AIOs that already beat many air coolers.'),
      menosDe(80, 'Refrigeración líquida de 240 y 360 mm por menos de $80.', '240 and 360 mm liquid cooling under $80.'),
    ];
  })(),

  // ── Refrigeración por aire ─────────────────────────────────────────
  'refrigeracion-normal': (() => [
    F('tipo', 'de torre simple', 'single-tower', (p) => /simple/i.test(sp(p, 'Torres')), 'Los disipadores de torre simple ocupan menos espacio y son más fáciles de instalar.', 'Single-tower coolers take less room and are easier to install.'),
    F('tipo', 'de doble torre', 'dual-tower', (p) => /doble/i.test(sp(p, 'Torres')), 'Los de doble torre disipan más calor: ideales para procesadores potentes con poco ruido.', 'Dual-tower coolers shed more heat: ideal for powerful CPUs at low noise.'),
    F('caracteristicas', 'con ARGB', 'with ARGB', (p) => /argb/i.test(sp(p, 'Ventiladores') + p.nombre), 'Disipadores con ventiladores ARGB para dar color a tu build.', 'Coolers with ARGB fans to add color to your build.'),
    F('caracteristicas', 'con pantalla', 'with display', (p) => /pantalla|display|ips/i.test(sp(p, 'Extra') + p.nombre), 'Disipadores con pantalla digital que muestra la temperatura del CPU.', 'Coolers with a digital screen showing CPU temperature.'),
    F('color', 'blancos', 'white', (p) => /blanc|white/i.test(p.nombre), 'Disipadores blancos para builds claros.', 'White coolers for light-colored builds.'),
    marca('Thermalright'), marca('Noctua'), marca('ARCTIC'), marca('Cooler Master'),
    menosDe(30, 'Disipadores baratos que rinden mucho más que el ventilador de caja.', 'Cheap coolers that outperform the stock fan by a wide margin.'),
    menosDe(50, 'Los mejores disipadores de aire por menos de $50: relación precio-rendimiento imbatible.', 'The best air coolers under $50: unbeatable value.'),
  ])(),

  // ── Gabinetes ──────────────────────────────────────────────────────
  'gabinetes-gamer': (() => {
    const color = (p) => low(sp(p, 'Color') + ' ' + p.nombre);
    return [
      F('color', 'negros', 'black', (p) => /negro|black/i.test(color(p)), 'Gabinetes negros: el look clásico que combina con todo.', 'Black cases: the classic look that goes with everything.'),
      F('color', 'blancos', 'white', (p) => /blanco|white/i.test(color(p)), 'Gabinetes blancos para builds limpios y luminosos.', 'White cases for clean, bright builds.'),
      F('caracteristicas', 'con vidrio panorámico', 'with panoramic glass', (p) => /panor|cristal/i.test(sp(p, 'Panel') + p.nombre), 'Vidrio panorámico para mostrar todo el interior de tu PC.', 'Panoramic glass to show off the entire inside of your PC.'),
      F('caracteristicas', 'con USB-C frontal', 'with front USB-C', (p) => /c/i.test(sp(p, 'Puerto Frontal').replace(/usb/gi, '')) , 'Puerto USB-C frontal para conectar periféricos y cargar dispositivos modernos.', 'Front USB-C port for modern peripherals and fast charging.'),
      F('caracteristicas', 'con buen flujo de aire', 'high airflow', (p) => /mesh|malla|flow|airflow/i.test(sp(p, 'Panel') + p.nombre), 'Frente de malla y varios ventiladores para temperaturas más bajas.', 'Mesh fronts and multiple fans for lower temperatures.'),
      F('tamano', 'Micro-ATX', 'Micro-ATX', (p) => /micro/i.test(sp(p, 'Formato') + p.nombre), 'Gabinetes compactos Micro-ATX para escritorios con poco espacio.', 'Compact Micro-ATX cases for small desks.'),
      marca('NZXT'), marca('Corsair'), marca('Lian Li'), marca('Cooler Master'),
      menosDe(60, 'Gabinetes baratos con buen airflow para un build económico.', 'Cheap cases with good airflow for a budget build.'),
      menosDe(100, 'Gabinetes de gama media por menos de $100, muchos con vidrio templado.', 'Mid-range cases under $100, many with tempered glass.'),
    ];
  })(),

  // ── Teclados ───────────────────────────────────────────────────────
  teclados: (() => {
    const lay = (p) => low(sp(p, 'Layout') + ' ' + sp(p, 'Tipo') + ' ' + p.nombre);
    const inal = (p) => /inal|wireless|2\.4|bt|bluetooth|tri/i.test(sp(p, 'Conexión') + ' ' + p.nombre);
    return [
      S(F('tamano', 'al 60 %', '60%', (p) => /\b60\s?%/.test(lay(p)), 'Los teclados 60 % ahorran espacio en el escritorio y dan más sitio al mouse.', '60% keyboards save desk space and give your mouse more room.'), 'compactos-60', '60-percent'),
      S(F('tamano', 'al 75 %', '75%', (p) => /\b75\s?%/.test(lay(p)), 'El 75 % conserva las flechas y la fila de funciones en formato compacto: el favorito de muchos jugadores.', '75% keeps the arrows and function row in a compact size: a favorite among many gamers.'), 'compactos-75', '75-percent'),
      F('tamano', 'TKL (sin teclado numérico)', 'TKL (tenkeyless)', (p) => /\btkl\b/.test(lay(p)), 'Los TKL quitan el teclado numérico: más espacio para el mouse sin perder las flechas.', 'TKL boards drop the numpad: more mouse room without losing the arrows.'),
      F('tamano', 'de tamaño completo', 'full-size', (p) => /full/i.test(sp(p, 'Layout') + sp(p, 'Tipo')), 'Tamaño completo, con teclado numérico, para trabajo y juegos.', 'Full size, with numpad, for work and play.'),
      F('conexion', 'inalámbricos', 'wireless', (p) => inal(p), 'Teclados inalámbricos con 2,4 GHz y Bluetooth para un escritorio sin cables.', 'Wireless keyboards with 2.4 GHz and Bluetooth for a cable-free desk.'),
      F('conexion', 'con cable', 'wired', (p) => !inal(p), 'Los teclados con cable ofrecen la mínima latencia y no necesitan batería.', 'Wired keyboards give the lowest latency and need no battery.'),
      F('caracteristicas', 'mecánicos', 'mechanical', (p) => /mec/i.test(sp(p, 'Tipo') + p.nombre) && !/membrana/i.test(sp(p, 'Tipo')), 'Teclados mecánicos con switches individuales: mejor tacto, durabilidad y respuesta.', 'Mechanical keyboards with individual switches: better feel, durability and response.'),
      F('caracteristicas', 'hot-swap', 'hot-swap', (p) => /hot-?swap/i.test(sp(p, 'Switches') + sp(p, 'Tipo') + p.nombre), 'Con hot-swap cambias los switches sin soldar para personalizar el tacto.', 'Hot-swap lets you change switches without soldering to customize the feel.'),
      F('caracteristicas', 'magnéticos (rapid trigger)', 'magnetic (rapid trigger)', (p) => /magn|hall|omnipoint|rapid trigger/i.test(sp(p, 'Switches') + sp(p, 'Tipo') + p.nombre), 'Switches magnéticos con rapid trigger: la respuesta más rápida para FPS competitivos.', 'Magnetic switches with rapid trigger: the fastest response for competitive FPS.'),
      marca('Redragon'), marca('SteelSeries'), marca('Razer'), marca('AULA'),
      menosDe(40, 'Teclados baratos para empezar en gaming sin gastar de más.', 'Cheap keyboards to start gaming without overspending.'),
      menosDe(70, 'Teclados mecánicos de gama media por menos de $70.', 'Mid-range mechanical keyboards under $70.'),
    ];
  })(),

  // ── Mouse ──────────────────────────────────────────────────────────
  mouse: (() => {
    const inal = (p) => /inal|wireless|lightspeed|hyperspeed|2\.4|bt/i.test(sp(p, 'Conexión') + ' ' + p.nombre);
    const peso = (p) => num(sp(p, 'Peso'));
    return [
      F('conexion', 'inalámbricos', 'wireless', (p) => inal(p), 'Los mouse inalámbricos modernos igualan en latencia a los de cable gracias a 2,4 GHz.', 'Modern wireless mice match wired latency thanks to 2.4 GHz.'),
      F('conexion', 'con cable', 'wired', (p) => !inal(p), 'Los mouse con cable no necesitan batería y ofrecen la respuesta más consistente.', 'Wired mice need no battery and offer the most consistent response.'),
      F('caracteristicas', 'ultraligeros', 'ultralight', (p) => peso(p) > 0 && peso(p) <= 60, 'Los mouse de 60 g o menos reducen la fatiga y favorecen los movimientos rápidos en FPS.', 'Mice at 60 g or less reduce fatigue and favor fast movements in FPS games.'),
      F('caracteristicas', 'para MMO', 'for MMO', (p) => /mmo|naga|scimitar|moba/i.test(p.nombre), 'Con panel de botones laterales para macros y habilidades en MMO y MOBA.', 'With a side button grid for macros and abilities in MMOs and MOBAs.'),
      F('caracteristicas', 'de sensor de 30K DPI o más', 'with a 30K+ DPI sensor', (p) => num(sp(p, 'DPI')) >= 30000, 'Sensores de 30 000 DPI o más para máxima precisión y seguimiento sin errores.', 'Sensors with 30,000 DPI or more for maximum precision and error-free tracking.'),
      marca('Razer'), marca('Logitech'), marca('Glorious'), marca('SteelSeries'),
      menosDe(40, 'Mouse gamer baratos con buen sensor para empezar.', 'Cheap gaming mice with a solid sensor to get started.'),
      menosDe(70, 'Mouse de gama media por menos de $70, muchos inalámbricos.', 'Mid-range mice under $70, many of them wireless.'),
      masDe(100, 'Mouse de gama alta: los más ligeros y rápidos, usados por profesionales de esports.', 'High-end mice: the lightest and fastest, used by esports pros.'),
    ];
  })(),

  // ── Audífonos ──────────────────────────────────────────────────────
  audifonos: (() => {
    const inal = (p) => /inal|wireless/i.test(sp(p, 'Tipo') + sp(p, 'Conexión') + p.nombre) || /2\.4|bluetooth|lightspeed/i.test(sp(p, 'Conexión'));
    return [
      F('conexion', 'inalámbricos', 'wireless', (p) => inal(p), 'Audífonos inalámbricos de baja latencia con 2,4 GHz, muchos con Bluetooth y batería de larga duración.', 'Low-latency 2.4 GHz wireless headsets, many with Bluetooth and long battery life.'),
      F('conexion', 'con cable', 'wired', (p) => !inal(p), 'Los audífonos con cable no necesitan carga y suelen costar menos.', 'Wired headsets never need charging and usually cost less.'),
      F('conexion', 'con Bluetooth', 'with Bluetooth', (p) => /bluetooth|bt/i.test(sp(p, 'Conexión') + p.nombre), 'Conectan por 2,4 GHz para jugar y por Bluetooth al teléfono a la vez.', 'Connect over 2.4 GHz for gaming and Bluetooth to your phone at the same time.'),
      F('caracteristicas', 'con sonido envolvente', 'with surround sound', (p) => /7\.1|surround|espacial|spatial/i.test(sp(p, 'Sonido') + p.nombre), 'Sonido envolvente 7.1 o espacial para ubicar enemigos y pasos en shooters.', '7.1 or spatial surround to pinpoint enemies and footsteps in shooters.'),
      F('caracteristicas', 'para Xbox', 'for Xbox', (p) => /xbox/i.test(p.nombre), 'Audífonos compatibles con Xbox Series X|S y Xbox One.', 'Headsets compatible with Xbox Series X|S and Xbox One.'),
      marca('Razer'), marca('HyperX'), marca('EKSA'), marca('Corsair'), marca('Turtle Beach'),
      menosDe(50, 'Audífonos gamer baratos con micrófono para jugar y chatear.', 'Cheap gaming headsets with a mic for gaming and chat.'),
      menosDe(100, 'Audífonos de gama media por menos de $100, incluidos varios inalámbricos.', 'Mid-range headsets under $100, including several wireless ones.'),
      masDe(150, 'Audífonos premium con la mejor calidad de sonido, micrófono y comodidad.', 'Premium headsets with the best sound quality, mic and comfort.'),
    ];
  })(),

  // ── Monitores ──────────────────────────────────────────────────────
  monitores: (() => {
    const res = (p) => low(sp(p, 'Resolución'));
    const hz = (p) => num(sp(p, 'Frecuencia'));
    const pulg = (p) => num(sp(p, 'Tamaño'));
    const panel = (p) => low(sp(p, 'Panel'));
    const curvo = (p) => /curv/i.test(sp(p, 'Tamaño') + p.nombre);
    return [
      F('resolucion', 'Full HD (1080p)', 'Full HD (1080p)', (p) => /1920x1080/.test(res(p)), 'Full HD sigue siendo la resolución ideal para esports y equipos de gama media.', 'Full HD is still the ideal resolution for esports and mid-range PCs.'),
      F('resolucion', '2K (QHD, 1440p)', '2K (QHD, 1440p)', (p) => /2560x1440/.test(res(p)), '2K o QHD es el punto dulce de 2026: más nitidez que 1080p sin la exigencia de 4K.', '2K or QHD is today\'s sweet spot: sharper than 1080p without the demands of 4K.'),
      F('resolucion', '4K', '4K', (p) => /3840x2160/.test(res(p)), 'Monitores 4K para máxima nitidez en juegos, cine y edición; requieren una GPU potente.', '4K monitors for maximum sharpness in games, movies and editing; they need a powerful GPU.'),
      F('resolucion', 'ultrawide', 'ultrawide', (p) => /3440x1440/.test(res(p)), 'Los monitores ultrawide 21:9 amplían tu campo de visión y dan una inmersión enorme.', 'Ultrawide 21:9 monitors widen your field of view for huge immersion.'),
      F('panel', 'curvos', 'curved', (p) => curvo(p), 'Los monitores curvos envuelven tu campo de visión para una experiencia más inmersiva.', 'Curved monitors wrap around your field of view for a more immersive experience.'),
      S(F('panel', 'OLED', 'OLED', (p) => /oled/i.test(panel(p)), 'Paneles OLED y QD-OLED: negros perfectos, contraste infinito y tiempos de respuesta mínimos.', 'OLED and QD-OLED panels: perfect blacks, infinite contrast and minimal response times.'), 'panel-oled', 'oled-panel'),
      S(F('panel', 'IPS', 'IPS', (p) => /ips/i.test(panel(p)), 'Los paneles IPS ofrecen los mejores colores y ángulos de visión.', 'IPS panels deliver the best colors and viewing angles.'), 'panel-ips', 'ips-panel'),
      S(F('panel', 'VA', 'VA', (p) => /\bva\b/i.test(panel(p)), 'Los paneles VA destacan por su contraste alto y su precio contenido.', 'VA panels stand out for high contrast and affordable pricing.'), 'panel-va', 'va-panel'),
      F('tamano', 'de 24 pulgadas', '24-inch', (p) => pulg(p) === 24, 'Los 24 pulgadas son perfectos para esports y escritorios pequeños.', '24-inch monitors are perfect for esports and small desks.'),
      F('tamano', 'de 27 pulgadas', '27-inch', (p) => Math.round(pulg(p)) === 27 || pulg(p) === 26.5, 'Los 27 pulgadas son el tamaño más popular para jugar en 1440p.', '27-inch is the most popular size for 1440p gaming.'),
      F('tamano', 'de 34 pulgadas', '34-inch', (p) => pulg(p) === 34, 'Monitores de 34 pulgadas en formato ultrapanorámico.', '34-inch monitors in ultrawide format.'),
      F('velocidad', 'de 180 Hz', '180 Hz', (p) => hz(p) === 180, '180 Hz es una frecuencia excelente para juegos fluidos sin pagar de más.', '180 Hz is an excellent refresh rate for smooth gaming without overspending.'),
      F('velocidad', 'de 240 Hz o más', '240 Hz or higher', (p) => hz(p) >= 240, 'Con 240 Hz o más tienes la máxima fluidez para esports y shooters competitivos.', 'At 240 Hz and above you get top fluidity for esports and competitive shooters.'),
      marca('ASUS'), marca('Samsung'), marca('LG'), marca('KOORUI'),
      menosDe(150, 'Monitores gamer baratos de 24 y 27 pulgadas con tasas de refresco altas.', 'Cheap 24 and 27-inch gaming monitors with high refresh rates.'),
      menosDe(250, 'Hasta $250 encuentras monitores 2K de 180 Hz y muchos de 240 Hz.', 'Up to $250 you find 2K 180 Hz monitors and many 240 Hz options.'),
      masDe(400, 'Monitores de gama alta: OLED, ultrawide y 4K de máxima calidad.', 'High-end monitors: OLED, ultrawide and top-quality 4K.'),
    ];
  })(),
};

// ───────────────────────── Construcción ─────────────────────────
// Devuelve, por categoría, los filtros que tienen suficientes productos, con sus slugs en ES/EN y estadísticas.
export function construirFiltros(productos) {
  const salida = {};
  for (const [cat, defs] of Object.entries(DEFINICIONES)) {
    const lista = productos[cat] ?? [];
    const usadosEs = new Set();
    const usadosEn = new Set();
    salida[cat] = [];
    for (const d of defs) {
      const items = lista.filter((p) => d.test(p));
      if (items.length < MIN_PRODUCTOS || items.length === lista.length) continue;
      let slugEs = d.slugEs ?? slugify(d.es);
      let slugEn = d.slugEn ?? slugify(d.en);
      if (usadosEs.has(slugEs) || usadosEn.has(slugEn)) continue;
      usadosEs.add(slugEs); usadosEn.add(slugEn);
      const precios = items.map((p) => p.precio);
      const marcas = [...new Set(items.map(marcaNorm).filter(Boolean))];
      salida[cat].push({
        cat, grupo: d.grupo, es: d.es, en: d.en, slugEs, slugEn, tipEs: d.tipEs, tipEn: d.tipEn,
        ids: items.map((p) => p.id), total: items.length,
        min: Math.min(...precios), max: Math.max(...precios), marcas,
      });
    }
  }
  return salida;
}

// Mapas slug ES ↔ EN por categoría (para hreflang y selector de idioma)
export function mapasDeSlugs(filtros) {
  const esAEn = {}, enAEs = {};
  for (const [cat, lista] of Object.entries(filtros)) {
    esAEn[cat] = Object.fromEntries(lista.map((f) => [f.slugEs, f.slugEn]));
    enAEs[cat] = Object.fromEntries(lista.map((f) => [f.slugEn, f.slugEs]));
  }
  return { esAEn, enAEs };
}
