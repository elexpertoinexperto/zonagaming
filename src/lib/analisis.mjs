// Análisis automático de cada producto (ES y EN), calculado en el build SOLO con datos reales del catálogo:
// especificaciones, precio y posición frente a los demás productos de su categoría. Nada se inventa: cada frase
// sale de un valor concreto de la ficha, así que dos productos distintos nunca comparten el mismo análisis.
// Se muestra con src/components/AnalisisProducto.astro. Para afinar una categoría, edita su función en REGLAS.
import { puntuarGpu, puntuarCpu } from './rendimiento.mjs';
import { nivelGpu } from './gpu-nivel.mjs';

const quitaTildes = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const num = (s) => {
  const m = String(s ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
};
// Valor de una especificación por nombre (insensible a tildes y mayúsculas; admite prefijo)
const spec = (p, ...nombres) => {
  for (const [k, v] of Object.entries(p.especificaciones || {})) {
    const kn = quitaTildes(k);
    if (nombres.some((n) => kn.startsWith(quitaTildes(n)))) return /^n\/[da]$/i.test(String(v).trim()) ? '' : String(v);
  }
  return '';
};
// «Sin RGB», «Sin incluir», «Sin Microfono»… son una ausencia, no un dato: no deben salir como si fueran una característica
const AUSENTE = /^(n\/[da]|sin\s+(incluir|rgb|micr[oó]fono)|not included|no\s+(rgb|microphone))$/i;
const valido = (v) => v && !AUSENTE.test(String(v).trim());
export const dinero = (n) => `$${n.toFixed(2)}`;
export const corto = (nombre, n = 58) => (nombre.length > n ? nombre.slice(0, n).replace(/\s+\S*$/, '') + '…' : nombre);

// ── Reglas por categoría: devuelven { pros, contras, para, nopara, faqs } ya en el idioma pedido ──
// t(es, en) elige el texto del idioma. Cada regla solo se dispara si el dato existe.
const REGLAS = {
  'tarjetas-graficas': (p, t, cat) => {
    const { puntos, chip, vram } = puntuarGpu(p);
    const tdp = num(spec(p, 'TDP'));
    const bus = num(spec(p, 'AnchoBus', 'Ancho'));
    const ram = spec(p, 'VRAM');
    const pros = [], contras = [];
    // la VRAM habla de texturas, no de FPS: solo se menciona 1440p/4K si el chip rinde para eso
    if (vram >= 16 && puntos >= 120) pros.push(t(`${vram} GB de VRAM: margen de sobra para texturas altas en 1440p e incluso 4K.`, `${vram} GB of VRAM: plenty of headroom for high textures at 1440p and even 4K.`));
    else if (vram >= 12 && puntos >= 120) pros.push(t(`${vram} GB de VRAM: cómoda para 1440p con texturas altas.`, `${vram} GB of VRAM: comfortable for 1440p with high textures.`));
    else if (vram >= 12) pros.push(t(`${vram} GB de VRAM: memoria de sobra para texturas altas; los FPS los marca el chip, no la memoria.`, `${vram} GB of VRAM: plenty of memory for high textures; the chip, not the memory, sets the frame rate.`));
    else if (vram >= 8) pros.push(t(`${vram} GB de VRAM: suficiente para 1080p en calidad alta.`, `${vram} GB of VRAM: enough for 1080p at high settings.`));
    if (/GDDR7/i.test(ram)) pros.push(t('Memoria GDDR7, la generación más reciente y rápida.', 'GDDR7 memory, the newest and fastest generation.'));
    if (tdp && tdp <= 160) pros.push(t(`Consumo contenido (${tdp} W): una fuente de calidad de 550–650 W suele bastar.`, `Modest power draw (${tdp} W): a quality 550–650 W PSU is usually enough.`));
    if (puntos >= 160) pros.push(t(`Rendimiento de gama alta: ${Math.round(puntos)} puntos en nuestro índice (la RTX 5060 vale 100).`, `High-end performance: ${Math.round(puntos)} points on our index (the RTX 5060 is 100).`));
    if (vram && vram <= 6) contras.push(t(`Solo ${vram} GB de VRAM: se queda justa en juegos recientes con texturas altas.`, `Only ${vram} GB of VRAM: tight for recent games with high textures.`));
    if (tdp >= 250) contras.push(t(`Consumo alto (${tdp} W): pide fuente de 750 W o más y buen flujo de aire en el gabinete.`, `High power draw (${tdp} W): needs a 750 W or larger PSU and good case airflow.`));
    if (bus && bus <= 128 && vram >= 8) contras.push(t(`Bus de memoria de ${bus} bits: rinde mejor a 1080p y 1440p que en 4K.`, `${bus}-bit memory bus: better suited to 1080p and 1440p than 4K.`));
    if (puntos <= 50) contras.push(t('Es un modelo de generaciones anteriores: sin las tecnologías de reescalado más recientes.', 'This is an older-generation model: it lacks the latest upscaling technologies.'));
    const res = puntos >= 190 ? t('1440p en ajustes altos y 4K con reescalado', '1440p at high settings and 4K with upscaling')
      : puntos >= 120 ? t('1440p en ajustes altos', '1440p at high settings')
      : puntos >= 90 ? t('1080p en ajustes altos', '1080p at high settings')
      : puntos >= 60 ? t('1080p en ajustes medios', '1080p at medium settings')
      : t('esports y títulos ligeros en 1080p', 'esports and light titles at 1080p');
    const w = tdp <= 130 ? 550 : tdp <= 180 ? 650 : tdp <= 250 ? 750 : 850;
    const nv = nivelGpu(p); // ¿gráfica de entrada, media o alta? (src/lib/gpu-nivel.mjs)
    return {
      nivel: nv.nivel, clase: t(nv.clase.es, nv.clase.en),
      pros, contras,
      para: t(`Pensada para jugar en ${res}. Su chip (${chip}) está dentro del grupo de rendimiento de ${Math.round(puntos)} puntos de nuestro índice.`, `Built for ${res}. Its chip (${chip}) sits at ${Math.round(puntos)} points on our performance index.`),
      nopara: puntos >= 160 ? t('Si juegas a 1080p en esports, probablemente pagues más rendimiento del que vas a usar.', 'If you only play esports at 1080p, you may pay for performance you will not use.')
        : t('Si buscas 4K nativo con todo al máximo, necesitarás un modelo de mayor gama.', 'If you want native 4K with everything maxed, you will need a higher-tier model.'),
      faqs: [
        { q: t('¿Es una gráfica de entrada?', 'Is it an entry-level graphics card?'), a: t(nv.porque.es, nv.porque.en) },
        { q: t(`¿Qué fuente necesita la ${chip}?`, `What power supply does the ${chip} need?`),
          a: t(`Con un consumo de ${tdp || 'N/D'} W, lo razonable es una fuente de calidad de al menos ${w} W (80+ Bronze o superior) para dejar margen al resto del equipo.`, `At ${tdp || 'N/A'} W, a quality PSU of at least ${w} W (80+ Bronze or better) leaves room for the rest of the system.`) },
        { q: t(`¿Para qué resolución sirve esta tarjeta?`, `What resolution is this card for?`),
          a: t(`Con ${vram} GB de VRAM y ${Math.round(puntos)} puntos en nuestro índice, es una buena opción para ${res}.`, `With ${vram} GB of VRAM and ${Math.round(puntos)} points on our index, it is a good fit for ${res}.`) },
      ],
    };
  },

  procesadores: (p, t) => {
    const { puntos, plataforma, nucleos, hilos } = puntuarCpu(p);
    const tdp = num(spec(p, 'TDP'));
    const turbo = num(spec(p, 'Velocidad Turbo'));
    const pros = [], contras = [];
    const mem = /AM5|1851/.test(plataforma) ? 'DDR5' : /AM4/.test(plataforma) ? 'DDR4' : t('DDR4 o DDR5 según la placa', 'DDR4 or DDR5 depending on the board');
    if (nucleos >= 12) pros.push(t(`${nucleos} núcleos y ${hilos} hilos: sobrado para jugar mientras transmites o editas.`, `${nucleos} cores and ${hilos} threads: plenty to game while streaming or editing.`));
    else if (nucleos >= 8) pros.push(t(`${nucleos} núcleos: el punto dulce para jugar con margen a futuro.`, `${nucleos} cores: the sweet spot for gaming with future headroom.`));
    else if (nucleos >= 6) pros.push(t(`${nucleos} núcleos: suficiente para juego y uso diario con un coste contenido.`, `${nucleos} cores: enough for gaming and daily use at a low cost.`));
    if (turbo >= 5) pros.push(t(`Turbo de hasta ${turbo} GHz: ritmo alto en juegos que dependen de un solo núcleo.`, `Up to ${turbo} GHz boost: strong pace in games that lean on a single core.`));
    if (/X3D/i.test(p.nombre)) pros.push(t('Caché 3D V-Cache: de lo mejor para FPS en juegos.', '3D V-Cache: among the best for in-game FPS.'));
    // El TDP de 65 W es la potencia base: con 12+ hilos de gama alta el procesador consume bastante más en turbo
    if (tdp && tdp <= 65 && nucleos <= 10) pros.push(t(`TDP de ${tdp} W: se enfría bien con un disipador de aire sencillo.`, `${tdp} W TDP: runs fine with a simple air cooler.`));
    if (tdp >= 125) contras.push(t(`TDP de ${tdp} W: conviene un disipador de doble torre o una refrigeración líquida.`, `${tdp} W TDP: a dual-tower air cooler or liquid cooling is advisable.`));
    if (nucleos && nucleos <= 6) contras.push(t(`${nucleos} núcleos: justo para producción pesada (render, compilación).`, `${nucleos} cores: tight for heavy production work (rendering, compiling).`));
    if (/AM4/.test(plataforma)) contras.push(t('Plataforma AM4: no admite DDR5 y su camino de mejoras ya es limitado.', 'AM4 platform: no DDR5 support and a limited upgrade path.'));
    return {
      pros, contras,
      para: t(`Es un procesador para el socket ${plataforma}, que usa memoria ${mem}. Tiene ${puntos} puntos en nuestro índice (el Ryzen 5 9600X vale 120).`, `This processor uses the ${plataforma} socket with ${mem} memory. It scores ${puntos} on our index (the Ryzen 5 9600X is 120).`),
      nopara: nucleos >= 12 ? t('Si solo juegas, parte de esos núcleos no se aprovecha; un modelo de 6–8 núcleos rinde igual en juegos.', 'If you only game, many of those cores go unused; a 6–8 core chip performs the same in games.')
        : t('Si editas vídeo o renderizas a diario, un modelo con más núcleos te ahorrará tiempo.', 'If you edit video or render daily, a chip with more cores will save you time.'),
      faqs: [
        { q: t('¿Qué placa base y memoria necesita?', 'What motherboard and memory does it need?'),
          a: t(`Necesita una placa con socket ${plataforma} y memoria ${mem}.`, `It needs a ${plataforma} socket motherboard and ${mem} memory.`) },
        { q: t('¿Qué refrigeración conviene?', 'What cooling should I use?'),
          a: t(`Con ${tdp || 'N/D'} W de TDP, ${tdp >= 125 ? 'una torre doble o una líquida de 240 mm o más' : 'un disipador de aire de calidad es suficiente'}.`, `At ${tdp || 'N/A'} W TDP, ${tdp >= 125 ? 'a dual tower or a 240 mm+ liquid cooler' : 'a quality air cooler is enough'}.`) },
      ],
    };
  },

  'memoria-ram': (p, t) => {
    const cap = spec(p, 'Capacidad');
    const gb = num(cap);
    const tipo = /DDR5/i.test(spec(p, 'Tipo') || p.nombre) ? 'DDR5' : 'DDR4';
    const mhz = num(spec(p, 'Velocidad'));
    const cl = num((spec(p, 'Latencia').match(/CL\s*(\d+)/i) || [])[1] ?? spec(p, 'Latencia'));
    const compat = spec(p, 'Compatibilidad');
    const pros = [], contras = [];
    if (gb >= 32) pros.push(t(`${cap}: espacio de sobra para jugar, transmitir y tener aplicaciones abiertas.`, `${cap}: plenty of room to game, stream and keep apps open.`));
    else if (gb >= 16) pros.push(t(`${cap}: la capacidad recomendada hoy para jugar.`, `${cap}: the recommended amount for gaming today.`));
    if (tipo === 'DDR5' && mhz >= 6000) pros.push(t(`DDR5 a ${mhz} MHz: la velocidad que mejor aprovechan las plataformas AM5.`, `DDR5 at ${mhz} MHz: the speed AM5 platforms use best.`));
    if (cl && cl <= 30 && tipo === 'DDR5') pros.push(t(`Latencia CL${cl}: respuesta rápida, baja para DDR5.`, `CL${cl} latency: quick response, low for DDR5.`));
    if (valido(compat) && /EXPO|XMP/i.test(compat)) pros.push(t(`Perfiles de overclock automático (${compat}).`, `One-click overclock profiles (${compat}).`));
    if (gb && gb <= 16) contras.push(t(`${cap}: justo si además transmites o editas; considera 32 GB.`, `${cap}: tight if you also stream or edit; consider 32 GB.`));
    if (tipo === 'DDR4') contras.push(t('DDR4: no es compatible con placas DDR5; solo para plataformas anteriores.', 'DDR4: not compatible with DDR5 boards; for older platforms only.'));
    if (mhz && mhz <= 3200) contras.push(t(`${mhz} MHz es una velocidad base: en Ryzen se aprecia la ganancia con kits más rápidos.`, `${mhz} MHz is a baseline speed: Ryzen benefits from faster kits.`));
    return {
      pros, contras,
      para: tipo === 'DDR5' ? t('Para placas con socket AM5 o Intel de 12.ª generación en adelante con ranuras DDR5.', 'For AM5 or 12th-gen-and-newer Intel boards with DDR5 slots.')
        : t('Para plataformas con ranuras DDR4: AM4 y placas Intel de 12.ª/14.ª generación que sean DDR4.', 'For DDR4 platforms: AM4 and DDR4 versions of 12th/14th-gen Intel boards.'),
      nopara: tipo === 'DDR5' ? t('No sirve en una placa DDR4: los módulos no son compatibles entre sí.', 'It will not work in a DDR4 board: the modules are not interchangeable.')
        : t('No sirve en una placa DDR5: los módulos no son compatibles entre sí.', 'It will not work in a DDR5 board: the modules are not interchangeable.'),
      faqs: [
        { q: t('¿Es DDR4 o DDR5?', 'Is it DDR4 or DDR5?'), a: t(`Es ${tipo}, a ${mhz || 'N/D'} MHz${cl ? ` y latencia CL${cl}` : ''}.`, `It is ${tipo} at ${mhz || 'N/A'} MHz${cl ? ` with CL${cl} latency` : ''}.`) },
        { q: t('¿Cuántos módulos trae?', 'How many modules does it include?'), a: t(`El kit es ${cap}; instálalos en los slots que indique tu placa para activar el doble canal.`, `The kit is ${cap}; install them in the slots your board indicates to enable dual channel.`) },
      ],
    };
  },

  ssd: (p, t) => {
    const cap = spec(p, 'Capacidad');
    const gb = /TB/i.test(cap) ? num(cap) * 1000 : num(cap);
    const iface = spec(p, 'Interfaz');
    const lec = num(spec(p, 'Velocidad Lectura'));
    const esc = num(spec(p, 'Velocidad Escritura'));
    const ff = spec(p, 'Factor');
    const sata = /2\.5/.test(ff) || (lec && lec < 700);
    const pcie5 = /5\.0|Gen5/i.test(iface);
    const pros = [], contras = [];
    if (lec >= 10000) pros.push(t(`Lectura de ${lec} MB/s: velocidad PCIe 5.0, de las más rápidas del mercado.`, `${lec} MB/s read: PCIe 5.0 speed, among the fastest on the market.`));
    else if (lec >= 5000) pros.push(t(`Lectura de ${lec} MB/s: NVMe rápido, cargas de juego muy cortas.`, `${lec} MB/s read: fast NVMe, very short game load times.`));
    else if (lec >= 2500) pros.push(t(`Lectura de ${lec} MB/s: muy por encima de un disco SATA.`, `${lec} MB/s read: far above a SATA drive.`));
    if (gb >= 2000) pros.push(t(`${cap}: caben decenas de juegos AAA (muchos superan los 100 GB).`, `${cap}: room for dozens of AAA games (many exceed 100 GB).`));
    if (/2280/.test(ff)) pros.push(t('Formato M.2 2280: el estándar de casi todas las placas actuales.', 'M.2 2280 form factor: the standard on almost every current board.'));
    if (sata) contras.push(t('Es SATA (~550 MB/s): bastante más lento que un NVMe, aunque sirve como almacenamiento secundario.', 'It is SATA (~550 MB/s): much slower than NVMe, though fine as secondary storage.'));
    if (pcie5) contras.push(t('PCIe 5.0: se calienta; usa disipador y revisa que tu placa lo soporte.', 'PCIe 5.0: it runs hot; use a heatsink and check your board supports it.'));
    if (gb && gb <= 512) contras.push(t(`${cap}: entran pocos juegos AAA además del sistema.`, `${cap}: only a few AAA games fit next to the OS.`));
    if (/2230/.test(ff)) contras.push(t('Formato M.2 2230: es compacto (consolas portátiles); en un PC de escritorio necesitas un adaptador.', 'M.2 2230 form factor: compact (handhelds); a desktop PC needs an adapter.'));
    const juegos = gb ? Math.max(1, Math.floor((gb * 0.9) / 100)) : 0;
    return {
      pros, contras,
      para: sata ? t('Para ampliar el almacenamiento de un equipo con discos SATA o añadir un segundo disco económico.', 'For expanding storage on a SATA-based system or adding an inexpensive second drive.')
        : t('Para el disco principal del sistema y de tus juegos, en una placa con ranura M.2.', 'As the main system and games drive, in a board with an M.2 slot.'),
      nopara: sata ? t('Si buscas las cargas más cortas posibles, un NVMe PCIe 4.0 o 5.0 es mejor opción.', 'If you want the shortest possible load times, a PCIe 4.0 or 5.0 NVMe is a better choice.')
        : t('Si tu placa solo tiene bahías SATA, este modelo no es compatible.', 'If your board only has SATA bays, this model will not work.'),
      faqs: [
        { q: t('¿Cuántos juegos caben?', 'How many games fit?'), a: t(`Con ${cap} libres para juegos, caben unos ${juegos} títulos AAA de ~100 GB cada uno (menos si instalas el sistema aquí).`, `With ${cap} for games, about ${juegos} AAA titles of ~100 GB each fit (fewer if the OS lives here).`) },
        { q: t('¿Necesita disipador?', 'Does it need a heatsink?'), a: pcie5 ? t('Sí: los PCIe 5.0 alcanzan temperaturas altas y reducen su velocidad sin disipador.', 'Yes: PCIe 5.0 drives get hot and throttle without a heatsink.') : sata ? t('No: los SATA de 2.5" casi no se calientan.', 'No: 2.5" SATA drives barely heat up.') : t('Se recomienda si tu placa no trae uno integrado, sobre todo bajo cargas largas.', 'Recommended if your board lacks an integrated one, especially under long loads.') },
      ],
      extra: { esc },
    };
  },

  'fuentes-de-poder': (p, t) => {
    const w = num(spec(p, 'Potencia'));
    const cert = spec(p, 'Certif');
    const std = spec(p, 'Est');
    const mod = spec(p, 'Modular');
    const pros = [], contras = [];
    if (/Gold|Platinum|Titanium/i.test(cert)) pros.push(t(`Certificación ${cert}: alta eficiencia, menos calor y menos ruido.`, `${cert} rating: high efficiency, less heat and noise.`));
    if (/ATX 3/i.test(std)) pros.push(t(`Estándar ${std}: conector 12V-2×6 para tarjetas gráficas recientes.`, `${std} standard: 12V-2×6 connector for recent graphics cards.`));
    if (/Totalmente|Fully/i.test(mod)) pros.push(t('Totalmente modular: solo conectas los cables que usas, más orden y mejor flujo de aire.', 'Fully modular: connect only the cables you use for a tidier build and better airflow.'));
    if (w >= 850) pros.push(t(`${w} W: margen para una tarjeta de gama alta y futuras mejoras.`, `${w} W: headroom for a high-end card and future upgrades.`));
    if (/No Modular|Non-Modular/i.test(mod)) contras.push(t('No modular: los cables van fijos y cuesta más ordenarlos.', 'Non-modular: fixed cables make tidy routing harder.'));
    if (/Bronze/i.test(cert)) contras.push(t('Certificación Bronze: menor eficiencia que una Gold.', 'Bronze rating: lower efficiency than Gold.'));
    if (w && w <= 650) contras.push(t(`${w} W: alcanza para gama media, pero justo para una tarjeta de gama alta.`, `${w} W: fine for midrange, tight for a high-end card.`));
    const gpu = w >= 1000 ? 'RTX 5080' : w >= 850 ? 'RTX 5070 Ti / RX 9070 XT' : w >= 750 ? 'RTX 5070 / RX 9070' : 'RTX 5060 / RX 9060 XT';
    return {
      pros, contras,
      para: t(`Una fuente de ${w} W pensada para equipos con tarjetas como ${gpu}.`, `A ${w} W PSU meant for systems with cards like the ${gpu}.`),
      nopara: w >= 850 ? t('Si tu equipo usa una tarjeta de gama media, una de 650–750 W es suficiente y más barata.', 'If your system uses a midrange card, a 650–750 W unit is enough and cheaper.')
        : t('Si piensas montar una tarjeta de gama alta, elige una de 850 W o más.', 'If you plan a high-end card, pick an 850 W or larger unit.'),
      faqs: [
        { q: t(`¿Alcanza para una ${gpu.split(' / ')[0]}?`, `Is it enough for a ${gpu.split(' / ')[0]}?`), a: t(`Sí: ${w} W cubre esa tarjeta con margen para un procesador de gama media o alta.`, `Yes: ${w} W covers that card with room for a mid- or high-end processor.`) },
        { q: t('¿Qué certificación tiene?', 'What rating does it have?'), a: t(`Tiene certificación ${cert || 'N/D'}${std && valido(std) ? ` y estándar ${std}` : ''}.`, `It is rated ${cert || 'N/A'}${std && valido(std) ? ` with ${std} standard` : ''}.`) },
      ],
    };
  },

  'refrigeracion-liquida': (p, t) => {
    const rad = spec(p, 'Radiador');
    const mm = num(rad);
    const bomba = spec(p, 'Bomba');
    const compat = spec(p, 'Compat');
    const rgb = spec(p, 'RGB');
    const pros = [], contras = [];
    if (mm >= 360) pros.push(t(`Radiador de ${mm} mm: máxima capacidad de enfriamiento para procesadores de gama alta.`, `${mm} mm radiator: maximum cooling capacity for high-end processors.`));
    else if (mm >= 280) pros.push(t(`Radiador de ${mm} mm: muy buen equilibrio entre enfriamiento y tamaño.`, `${mm} mm radiator: a very good balance of cooling and size.`));
    else if (mm) pros.push(t(`Radiador de ${mm} mm: cabe en la mayoría de gabinetes.`, `${mm} mm radiator: fits most cases.`));
    if (/pantalla|screen|display|LCD|IPS/i.test(rgb)) pros.push(t('Incluye pantalla en el bloque: muestra temperaturas o animaciones.', 'Includes a display on the block for temperatures or animations.'));
    else if (valido(rgb)) pros.push(t(`Iluminación ${rgb} para combinar con el resto del equipo.`, `${rgb} lighting to match the rest of your build.`));
    if (mm >= 360) contras.push(t('Exige un gabinete con soporte para radiador de 360 mm (frontal o superior).', 'Requires a case with 360 mm radiator support (front or top).'));
    contras.push(t('Más complejo de montar que un disipador de aire y con bomba que puede hacer ruido con el tiempo.', 'More complex to install than an air cooler, and the pump can get noisy over time.'));
    return {
      pros, contras,
      para: t(`Para procesadores de gama media-alta y equipos donde importan la estética y el espacio sobre la placa. Compatibilidad según la ficha: ${compat || 'N/D'}.`, `For mid-to-high-end processors and builds where looks and board clearance matter. Compatibility per spec sheet: ${compat || 'N/A'}.`),
      nopara: t('Si tu procesador es de bajo consumo, un disipador de aire de calidad rinde igual y no tiene bomba que mantener.', 'If your processor is low power, a quality air cooler performs the same with no pump to maintain.'),
      faqs: [
        { q: t('¿Qué tamaño de gabinete necesita?', 'What case size does it need?'), a: t(`Debe admitir un radiador de ${mm || 'N/D'} mm en la parte frontal o superior; revisa las medidas de tu gabinete.`, `Your case must support a ${mm || 'N/A'} mm radiator at the front or top; check your case's specs.`) },
        { q: t('¿Con qué sockets es compatible?', 'Which sockets does it support?'), a: t(`Según la ficha: ${compat || 'N/D'}. Confirma el soporte de tu placa antes de comprar.`, `Per the spec sheet: ${compat || 'N/A'}. Confirm your board's socket before buying.`) },
      ],
    };
  },

  'refrigeracion-normal': (p, t) => {
    const torres = spec(p, 'Torres');
    const extra = spec(p, 'Extra');
    const compat = spec(p, 'Compat');
    const alt = num((extra.match(/(\d+)\s*mm\s*(?:de\s*)?(?:altura|height)|(?:altura|height)[^\d]*(\d+)/i) || [])[1] ?? (extra.match(/\/\s*(\d{3})\s*mm/) || [])[1]);
    const hp = num((extra.match(/(\d+)\s*Heatpipes/i) || [])[1]);
    const doble = /doble|dual/i.test(torres);
    const pros = [], contras = [];
    if (doble) pros.push(t('Torre doble: más superficie para disipar calor en procesadores exigentes.', 'Dual tower: more surface area to shed heat on demanding processors.'));
    else pros.push(t('Torre simple: compacta y fácil de montar, con buena compatibilidad con la RAM.', 'Single tower: compact and easy to install, with good RAM clearance.'));
    if (hp) pros.push(t(`${hp} heatpipes de cobre: buena transferencia de calor del procesador al aluminio.`, `${hp} copper heatpipes: good heat transfer from the processor to the fins.`));
    if (/pantalla|screen|display/i.test(extra)) pros.push(t('Incluye pantalla para ver temperaturas.', 'Includes a display to monitor temperatures.'));
    if (alt >= 150) contras.push(t(`Mide unos ${alt} mm de alto: verifica que tu gabinete lo admita con el panel lateral cerrado.`, `About ${alt} mm tall: check your case allows it with the side panel closed.`));
    if (!doble) contras.push(t('Torre simple: para procesadores muy exigentes puede quedarse corto.', 'Single tower: may fall short for very demanding processors.'));
    return {
      pros, contras,
      para: t(`Para quien quiere enfriar con fiabilidad sin bomba ni líquido. Compatibilidad según la ficha: ${compat || 'N/D'}.`, `For anyone who wants dependable cooling with no pump or liquid. Compatibility per spec sheet: ${compat || 'N/A'}.`),
      nopara: doble ? t('Si tu gabinete es compacto o usas RAM con disipador alto, puede no caber.', 'If your case is compact or you use tall-heatsink RAM, it may not fit.') : t('Si tu procesador es de gama alta con TDP elevado, considera una torre doble o una líquida.', 'If your processor is high-end with a high TDP, consider a dual tower or a liquid cooler.'),
      faqs: [
        { q: t('¿Es compatible con mi procesador?', 'Is it compatible with my processor?'), a: t(`Según la ficha: ${compat || 'N/D'}.`, `Per the spec sheet: ${compat || 'N/A'}.`) },
        { q: t('¿Cabe en mi gabinete?', 'Will it fit my case?'), a: t(`${alt ? `Mide unos ${alt} mm de alto. ` : ''}Compáralo con la altura máxima de disipador que admite tu gabinete.`, `${alt ? `It stands about ${alt} mm tall. ` : ''}Compare it with the maximum cooler height your case supports.`) },
      ],
    };
  },

  'gabinetes-gamer': (p, t) => {
    const formato = spec(p, 'Formato');
    const panel = spec(p, 'Panel');
    const vent = spec(p, 'Ventiladores');
    const puerto = spec(p, 'Puerto');
    const malla = /malla|mesh/i.test(panel);
    const vidrio = /vidrio|cristal|glass/i.test(panel);
    const pros = [], contras = [];
    if (malla) pros.push(t('Frente en malla: mejor flujo de aire y temperaturas más bajas.', 'Mesh front: better airflow and lower temperatures.'));
    if (vidrio) pros.push(t(`Panel de ${panel}: luce tu hardware por dentro.`, `${panel} panel: shows off your hardware.`));
    if (/\d/.test(vent) && valido(vent)) pros.push(t(`Ventiladores incluidos (${vent}): no tendrás que comprarlos aparte.`, `Fans included (${vent}): nothing extra to buy.`));
    if (/C\b|Type-C|USB-C/i.test(puerto)) pros.push(t('USB-C en el frontal: conexión moderna a mano.', 'Front USB-C: modern connectivity within reach.'));
    if (/Micro-ATX/i.test(formato)) contras.push(t('Formato Micro-ATX: solo admite placas Micro-ATX o Mini-ITX.', 'Micro-ATX form factor: only fits Micro-ATX or Mini-ITX boards.'));
    if (!valido(puerto)) contras.push(t('La ficha no indica los puertos frontales; confírmalo en la tienda.', 'The spec sheet does not list front ports; confirm in the store.'));
    return {
      pros, contras,
      para: t(`Formato ${formato || 'N/D'}${valido(vent) ? `, con ${vent}` : ''}. Para quien arma un equipo y quiere buena estética ${malla ? 'sin sacrificar ventilación' : 'y exhibir el interior'}.`, `${formato || 'N/A'} form factor${valido(vent) ? `, with ${vent}` : ''}. For builders who want good looks ${malla ? 'without sacrificing airflow' : 'and a showcase interior'}.`),
      nopara: t('Si montas una tarjeta gráfica muy larga o un radiador de 360 mm, revisa las medidas máximas del fabricante.', 'If you plan a very long graphics card or a 360 mm radiator, check the manufacturer\'s maximum clearances.'),
      faqs: [
        { q: t('¿Qué placas base admite?', 'Which motherboards does it support?'), a: t(`Es un gabinete ${formato || 'N/D'}; consulta la ficha para el listado exacto de formatos de placa.`, `It is a ${formato || 'N/A'} case; see the spec sheet for the exact motherboard formats.`) },
        { q: t('¿Trae ventiladores?', 'Does it include fans?'), a: valido(vent) ? t(`Sí: ${vent}.`, `Yes: ${vent}.`)
          : AUSENTE.test(vent.trim()) && !/n\/[da]/i.test(vent) ? t('No: este gabinete se vende sin ventiladores incluidos.', 'No: this case is sold without fans included.')
          : t('La ficha no lo detalla; confírmalo antes de comprar.', 'The spec sheet does not say; confirm before buying.') },
      ],
    };
  },

  teclados: (p, t) => {
    const tipo = spec(p, 'Tipo');
    const con = spec(p, 'Conex');
    const sw = spec(p, 'Switches');
    const layout = spec(p, 'Layout');
    const inal = /Inal|Wireless|BT|2\.4|Tri|Bluetooth|HyperSpeed|Lightspeed/i.test(con);
    const multi = /BT|Bluetooth|Tri/i.test(con); // varios modos de conexión (2,4 GHz / Bluetooth / cable)
    const pros = [], contras = [];
    if (/Hall|Magn/i.test(tipo + sw)) pros.push(t('Interruptores magnéticos: punto de activación ajustable y respuesta muy rápida.', 'Magnetic switches: adjustable actuation point and very fast response.'));
    if (/hot.?swap/i.test(sw)) pros.push(t('Hot-swap: cambias los switches sin soldar.', 'Hot-swap: change switches without soldering.'));
    const soloInal = /^(Inal\S*|Wireless)$/i.test(con.trim()); // «Inalámbrico» a secas: no repetirlo entre paréntesis
    if (multi) pros.push(t(`Conexión flexible (${con}): varios modos de conexión según el momento.`, `Flexible connectivity (${con}): several connection modes as needed.`));
    else if (inal) pros.push(t(`Conexión inalámbrica${soloInal ? '' : ` (${con})`}: sin cable sobre el escritorio.`, `Wireless connection${soloInal ? '' : ` (${con})`}: no cable across the desk.`));
    if (/60|65|75|TKL/i.test(layout + tipo)) pros.push(t(`Formato compacto (${layout || tipo}): libera espacio para mover el mouse.`, `Compact layout (${layout || tipo}): frees up room for mouse movement.`));
    if (/60%/.test(layout + tipo)) contras.push(t('60 %: sin teclas de función, flechas ni bloque numérico dedicados.', '60%: no dedicated function keys, arrows or numpad.'));
    else if (/65|75|TKL/i.test(layout + tipo)) contras.push(t('Sin bloque numérico: algunos trabajos de oficina lo echan de menos.', 'No numpad: some office work will miss it.'));
    if (!inal) contras.push(t('Solo cableado: menos libertad en el escritorio.', 'Wired only: less freedom on the desk.'));
    if (inal) contras.push(t('Inalámbrico: hay que cargar la batería de vez en cuando.', 'Wireless: you will need to charge the battery from time to time.'));
    return {
      pros, contras,
      para: t(`Teclado ${tipo || 'gamer'}${layout ? ` en formato ${layout}` : ''}. Pensado para jugar con respuesta rápida${inal ? ' y usar también en otros dispositivos' : ''}.`, `${tipo || 'Gaming'} keyboard${layout ? ` in ${layout} layout` : ''}. Built for gaming with fast response${inal ? ' and multi-device use' : ''}.`),
      nopara: t('Si necesitas la distribución en español con ñ grabada, revisa la ficha: muchos modelos vienen solo en ANSI inglés.', 'If you need a specific language layout, check the spec sheet: many models ship in ANSI only.'),
      faqs: [
        { q: t('¿Es mecánico?', 'Is it mechanical?'), a: t(`Tipo: ${tipo || 'no especificado'}; switches: ${valido(sw) ? sw : 'no especificados'}.`, `Type: ${tipo || 'not specified'}; switches: ${valido(sw) ? sw : 'not specified'}.`) },
        { q: t('¿Cómo se conecta?', 'How does it connect?'), a: t(`Conexión: ${con || 'N/D'}.`, `Connection: ${con || 'N/A'}.`) },
      ],
    };
  },

  mouse: (p, t) => {
    const sensor = spec(p, 'Sensor');
    const dpi = num(spec(p, 'DPI'));
    const peso = num(spec(p, 'Peso'));
    const con = spec(p, 'Conex');
    const inal = /Inal|2\.4|BT|Bluetooth|HyperSpeed|Lightspeed|Wireless/i.test(con);
    const rf = /2\.4|HyperSpeed|Lightspeed/i.test(con); // enlace por dongle: la latencia baja es de este modo, no del Bluetooth
    const pros = [], contras = [];
    if (peso && peso <= 60) pros.push(t(`Ultraligero (${peso} g): ideal para mover rápido en shooters.`, `Ultralight (${peso} g): ideal for fast movement in shooters.`));
    else if (peso && peso <= 85) pros.push(t(`Ligero (${peso} g): buen equilibrio entre velocidad y control.`, `Lightweight (${peso} g): a good balance of speed and control.`));
    if (dpi >= 25000) pros.push(t(`Sensor ${sensor} de hasta ${dpi} DPI: sobrado de resolución.`, `${sensor} sensor up to ${dpi} DPI: more resolution than you will need.`));
    if (inal && rf) pros.push(t(`Inalámbrico (${con}) con latencia muy baja por el receptor de 2,4 GHz.`, `Wireless (${con}) with very low latency through the 2.4 GHz receiver.`));
    else if (inal) pros.push(t(`Inalámbrico${/^(Inal\S*|Wireless)$/i.test(con.trim()) ? '' : ` (${con})`}: sin cable que estorbe.`, `Wireless${/^(Inal\S*|Wireless)$/i.test(con.trim()) ? '' : ` (${con})`}: no cable in the way.`));
    if (peso >= 100) contras.push(t(`Pesa ${peso} g: pesado para mover rápido, mejor para control y juegos de estrategia.`, `Weighs ${peso} g: heavy for fast flicks, better for control and strategy games.`));
    if (!inal) contras.push(t('Con cable: no hay batería que cargar, pero el cable limita el movimiento.', 'Wired: no battery to charge, but the cable limits movement.'));
    if (inal) contras.push(t('Inalámbrico: depende de la batería y suele costar más.', 'Wireless: depends on battery and usually costs more.'));
    return {
      pros, contras,
      para: peso && peso <= 85 ? t('Para shooters y juegos competitivos donde importan la velocidad y los flicks.', 'For shooters and competitive games where speed and flicks matter.')
        : t('Para juegos de estrategia, MMO o sesiones largas donde se prefiere control y agarre firme.', 'For strategy, MMO or long sessions where control and a firm grip are preferred.'),
      nopara: t('Si tienes manos muy grandes o muy pequeñas, revisa las medidas del cuerpo: el agarre importa más que el DPI.', 'If you have very large or very small hands, check the body size: grip matters more than DPI.'),
      faqs: [
        { q: t('¿Cuánto pesa y qué sensor usa?', 'How much does it weigh and what sensor does it use?'), a: t(`${peso ? `Pesa ${peso} g` : 'La ficha no indica su peso'}${sensor ? ` y usa el sensor ${sensor}${dpi ? ` (${dpi} DPI máximos)` : ''}` : ''}.`, `${peso ? `It weighs ${peso} g` : 'The spec sheet does not list its weight'}${sensor ? ` and uses the ${sensor} sensor${dpi ? ` (up to ${dpi} DPI)` : ''}` : ''}.`) },
        { q: t('¿Es inalámbrico?', 'Is it wireless?'), a: t(`Conexión: ${con || 'N/D'}.`, `Connection: ${con || 'N/A'}.`) },
      ],
    };
  },

  audifonos: (p, t) => {
    const tipo = spec(p, 'Tipo');
    const con = spec(p, 'Conex');
    const drivers = spec(p, 'Drivers');
    const mic = spec(p, 'Micro');
    const sonido = spec(p, 'Sonido');
    const inal = /Inal|2\.4|BT|Bluetooth|Wireless/i.test(tipo + con);
    const iem = /In-Ear|IEM/i.test(tipo);
    const pros = [], contras = [];
    if (num(drivers) >= 50) pros.push(t(`Drivers de ${drivers}: graves con más cuerpo para explosiones y efectos.`, `${drivers} drivers: fuller bass for explosions and effects.`));
    if (inal) pros.push(t(`Inalámbricos (${con}): sin cable que estorbe.`, `Wireless (${con}): no cable in the way.`));
    if (/desmont|detach/i.test(mic)) pros.push(t('Micrófono desmontable: lo quitas cuando no lo usas.', 'Detachable microphone: remove it when you do not need it.'));
    else if (valido(mic)) pros.push(t(`Micrófono ${mic} para hablar en partida.`, `${mic} microphone for in-game chat.`));
    if (valido(sonido)) pros.push(t(`Sonido ${sonido}: ayuda a ubicar pasos y disparos.`, `${sonido} audio: helps locate footsteps and shots.`));
    if (iem) contras.push(t('Formato intrauricular: más portátil, pero con menos escenario sonoro que unos over-ear.', 'In-ear format: more portable, but a narrower soundstage than over-ears.'));
    if (inal) contras.push(t('Inalámbricos: dependen de la batería y pueden añadir algo de latencia por Bluetooth.', 'Wireless: depends on battery and Bluetooth can add some latency.'));
    if (/7\.1/.test(sonido)) contras.push(t('El 7.1 es virtual: mejora la ubicación pero no equivale a altavoces reales.', 'The 7.1 is virtual: it improves positioning but is not real speakers.'));
    return {
      pros, contras,
      para: t(`Audífonos ${tipo || 'gamer'} con conexión ${con || 'N/D'}. Para quien quiere ubicar bien a los rivales y hablar con el equipo.`, `${tipo || 'Gaming'} headset with ${con || 'N/A'} connection. For players who want to locate opponents and talk to teammates.`),
      nopara: t('Si juegas en consola, confirma que la conexión (USB, 3,5 mm o dongle) sea compatible con tu equipo.', 'If you play on console, confirm the connection (USB, 3.5 mm or dongle) is compatible with your system.'),
      faqs: [
        { q: t('¿Tiene micrófono?', 'Does it have a microphone?'), a: valido(mic) ? t(`Sí: ${mic}.`, `Yes: ${mic}.`)
          : AUSENTE.test(String(mic).trim()) && !/n\/[da]/i.test(mic) ? t('No: es un modelo sin micrófono.', 'No: this model has no microphone.')
          : t('La ficha no lo detalla.', 'The spec sheet does not say.') },
        { q: t('¿Cómo se conecta?', 'How does it connect?'), a: t(`Conexión: ${con || 'N/D'}; tipo: ${tipo || 'N/D'}.`, `Connection: ${con || 'N/A'}; type: ${tipo || 'N/A'}.`) },
      ],
    };
  },

  monitores: (p, t) => {
    const tam = spec(p, 'Tama');
    const reso = spec(p, 'Resol');
    const hz = num(spec(p, 'Frecuencia'));
    const panel = spec(p, 'Panel');
    const resp = spec(p, 'Respuesta');
    const k4 = /3840|4K/i.test(reso);
    const qhd = /2560|QHD|3440/i.test(reso);
    const pros = [], contras = [];
    if (/OLED/i.test(panel)) pros.push(t(`Panel ${panel}: negros perfectos y respuesta casi instantánea.`, `${panel} panel: perfect blacks and near-instant response.`));
    if (hz >= 240) pros.push(t(`${hz} Hz: fluidez máxima para shooters y esports.`, `${hz} Hz: maximum smoothness for shooters and esports.`));
    else if (hz >= 144) pros.push(t(`${hz} Hz: movimiento fluido, el estándar para jugar.`, `${hz} Hz: fluid motion, the gaming standard.`));
    if (k4) pros.push(t(`Resolución ${reso}: máxima nitidez.`, `${reso} resolution: maximum sharpness.`));
    else if (qhd) pros.push(t(`Resolución ${reso}: más detalle que Full HD sin exigir tanto como 4K.`, `${reso} resolution: more detail than Full HD without being as demanding as 4K.`));
    if (k4) contras.push(t('En 4K necesitarás una tarjeta gráfica potente para mantener los FPS.', 'At 4K you will need a powerful graphics card to keep frame rates up.'));
    if (/VA/.test(panel) && !/OLED/.test(panel)) contras.push(t('Panel VA: contraste alto pero respuesta algo más lenta que un IPS rápido.', 'VA panel: high contrast but slightly slower response than a fast IPS.'));
    if (/curvo|curved/i.test(tam)) contras.push(t('Pantalla curva: gusta para inmersión, menos para trabajo con líneas rectas.', 'Curved screen: great for immersion, less so for work with straight lines.'));
    if (/1920|FHD/i.test(reso) && /2[6-9]|3\d/.test(tam)) contras.push(t('Full HD en un tamaño grande: la nitidez se nota menos que en QHD.', 'Full HD on a large screen: sharpness is less crisp than QHD.'));
    const gpu = k4 ? t('una tarjeta de gama alta (RTX 5070 Ti / RX 9070 XT o superior)', 'a high-end card (RTX 5070 Ti / RX 9070 XT or better)')
      : qhd ? t('una tarjeta de gama media-alta (RTX 5070 / RX 9070 GRE)', 'an upper-midrange card (RTX 5070 / RX 9070 GRE)')
      : t('una tarjeta de gama media (RTX 5060 / RX 9060 XT)', 'a midrange card (RTX 5060 / RX 9060 XT)');
    return {
      pros, contras,
      para: t(`Monitor${tam ? ` de ${tam}` : ''}${reso ? ` con ${reso}` : ''}${hz ? ` a ${hz} Hz` : ''}. Para exprimirlo conviene ${gpu}.`, `${tam ? `${tam} monitor` : 'Monitor'}${reso ? ` with ${reso}` : ''}${hz ? ` at ${hz} Hz` : ''}. To get the most from it, pair it with ${gpu}.`),
      nopara: t('Si tu tarjeta gráfica es modesta, no llegarás a los FPS que esta frecuencia permite; ajusta resolución y calidad.', 'If your graphics card is modest, you will not reach the frame rates this refresh rate allows; adjust resolution and quality.'),
      faqs: [
        { q: t('¿Qué tarjeta gráfica necesito?', 'What graphics card do I need?'), a: t(`Para ${reso || 'su resolución'}${hz ? ` a ${hz} Hz` : ''} recomendamos ${gpu}.`, `For ${reso || 'its resolution'}${hz ? ` at ${hz} Hz` : ''} we recommend ${gpu}.`) },
        { q: t('¿Qué panel y tiempo de respuesta tiene?', 'What panel and response time does it have?'), a: valido(panel) && valido(resp) ? t(`Panel ${panel} y respuesta de ${resp}.`, `${panel} panel with ${resp} response time.`)
          : valido(panel) ? t(`Panel ${panel}; la ficha no indica el tiempo de respuesta.`, `${panel} panel; the spec sheet does not list the response time.`)
          : valido(resp) ? t(`Respuesta de ${resp}; la ficha no indica el tipo de panel.`, `${resp} response time; the spec sheet does not list the panel type.`)
          : t('La ficha no detalla el panel ni el tiempo de respuesta.', 'The spec sheet does not detail the panel or the response time.') },
      ],
    };
  },
};

// ── Análisis completo de un producto ─────────────────────────────────────
// lista: productos de su categoría en el idioma pedido · base: '/mouse' o '/en/gaming-mice' · plural: 'mouse gamer'
export function analizar(catKey, producto, lista, lang, base, plural, listaEs = lista) {
  const t = (es, en) => (lang === 'en' ? en : es);
  const regla = REGLAS[catKey];
  // Las reglas buscan las especificaciones por su nombre en español: en inglés se renombran por posición (mismo orden)
  const esp = listaEs.find((x) => x.id === producto.id);
  const normal = lang === 'en' && esp
    ? { ...producto, especificaciones: Object.fromEntries(Object.keys(producto.especificaciones).map((k, i) => [Object.keys(esp.especificaciones)[i] ?? k, producto.especificaciones[k]])) }
    : producto;
  const r = regla ? regla(normal, t, catKey) : { pros: [], contras: [], para: '', nopara: '', faqs: [] };

  // posición por precio
  const ordenados = [...lista].sort((a, b) => a.precio - b.precio || a.id - b.id);
  const n = ordenados.length;
  const rank = ordenados.findIndex((x) => x.id === producto.id) + 1;
  const precios = ordenados.map((x) => x.precio);
  const mediana = n % 2 ? precios[(n - 1) / 2] : (precios[n / 2 - 1] + precios[n / 2]) / 2;
  const pct = Math.round(Math.abs(producto.precio / mediana - 1) * 100);
  const tier = rank <= n / 3 ? 'entrada' : rank <= (2 * n) / 3 ? 'media' : 'alta';
  const tierTxt = t({ entrada: 'gama de entrada', media: 'gama media', alta: 'gama alta' }[tier], { entrada: 'entry-level', media: 'mid-range', alta: 'high-end' }[tier]);
  const tercio = t({ entrada: 'el tercio más económico', media: 'el tercio intermedio', alta: 'el tercio más caro' }[tier], { entrada: 'the cheapest third', media: 'the middle third', alta: 'the most expensive third' }[tier]);
  const posicion = t(
    `Es el n.º ${rank} más económico de los ${n} productos de nuestro catálogo de ${plural} (${tercio} por precio). Cuesta ${pct === 0 ? 'lo mismo que' : `${pct} % ${producto.precio < mediana ? 'menos que' : 'más que'}`} la mediana de la categoría (${dinero(mediana)}).`,
    `It is the #${rank} cheapest of the ${n} products in our ${plural} catalog (${tercio} by price). It costs ${pct === 0 ? 'the same as' : `${pct}% ${producto.precio < mediana ? 'less than' : 'more than'}`} the category median (${dinero(mediana)}).`,
  );

  // vecinos por precio: el inmediatamente más barato y el inmediatamente más caro (con enlace y diferencias reales de ficha)
  const vecino = (o) => {
    if (!o) return null;
    const diffs = [];
    for (const [k, v] of Object.entries(producto.especificaciones || {})) {
      const ov = o.especificaciones?.[k];
      if (!valido(v) || !valido(ov) || quitaTildes(v) === quitaTildes(ov)) continue;
      diffs.push(`${k}: ${v} → ${ov}`);
      if (diffs.length === 3) break;
    }
    return { nombre: o.nombre, href: `${base}/${o.slug}-${o.id}/`, precio: o.precio, dif: o.precio - producto.precio, pct: Math.round(Math.abs(o.precio / producto.precio - 1) * 100), diffs };
  };
  const i = ordenados.findIndex((x) => x.id === producto.id);
  const masBarato = vecino(ordenados[i - 1]);
  const masCaro = vecino(ordenados[i + 1]);

  const nombreCorto = corto(producto.nombre, 48);
  const destaca = r.pros[0] ? r.pros[0].replace(/[.]$/, '') : '';
  const veredicto = r.clase ? t(
    `${nombreCorto} es ${r.clase} (${dinero(producto.precio)})${destaca ? `. Lo mejor: ${destaca.charAt(0).toLowerCase() + destaca.slice(1)}` : ''}${r.contras[0] ? `. A tener en cuenta: ${r.contras[0].replace(/[.]$/, '').replace(/^./, (c) => c.toLowerCase())}` : ''}.`,
    `${nombreCorto} is ${r.clase} (${dinero(producto.precio)})${destaca ? `. Best part: ${destaca.charAt(0).toLowerCase() + destaca.slice(1)}` : ''}${r.contras[0] ? `. Keep in mind: ${r.contras[0].replace(/[.]$/, '').replace(/^./, (c) => c.toLowerCase())}` : ''}.`,
  ) : t(
    `${nombreCorto} es una opción de ${tierTxt} dentro de nuestro catálogo de ${plural} (${dinero(producto.precio)})${destaca ? `. Lo mejor: ${destaca.charAt(0).toLowerCase() + destaca.slice(1)}` : ''}${r.contras[0] ? `. A tener en cuenta: ${r.contras[0].replace(/[.]$/, '').replace(/^./, (c) => c.toLowerCase())}` : ''}.`,
    `${nombreCorto} is ${tier === 'entrada' ? 'an' : 'a'} ${tierTxt} option in our ${plural} catalog (${dinero(producto.precio)})${destaca ? `. Best part: ${destaca.charAt(0).toLowerCase() + destaca.slice(1)}` : ''}${r.contras[0] ? `. Keep in mind: ${r.contras[0].replace(/[.]$/, '').replace(/^./, (c) => c.toLowerCase())}` : ''}.`,
  );

  return { nombreCorto, veredicto, posicion, tier, rank, total: n, mediana, ...r, masBarato, masCaro };
}
