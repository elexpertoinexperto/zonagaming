// Motor de rendimiento: puntúa GPU, CPU y RAM del catálogo y cruza esos puntos con la
// exigencia de cada juego (src/data/juegos-index.json) para generar, en tiempo de build:
//   - las recomendaciones del Recomendador (GPU + CPU + RAM por juego), y
//   - la guía "Juegos que puedes correr" de cada ficha de producto.
// Todo sale de productos.json: al añadir productos no hay que escribir nada a mano.
// Si un producto nuevo no se reconoce, el build FALLA con un mensaje claro (nunca se omite en silencio).
// Los puntos son un índice relativo orientativo (RTX 5060 = 100 en GPU); no son benchmarks exactos.

// ───────────────────────── Tablas de puntos ─────────────────────────
// El orden importa: la primera regla que coincide gana (p. ej. "5060 Ti" antes que "5060").
const GPU_TABLA = [
  [/GTX\s*960/i, 20, 'GTX 960'],
  [/Arc\s*A380/i, 22, 'Arc A380'],
  [/RX\s*580/i, 32, 'RX 580'],
  [/RTX\s*3050/i, 45, 'RTX 3050'],
  [/RTX\s*3060/i, 70, 'RTX 3060'],
  [/RX\s*7600/i, 75, 'RX 7600'],
  [/Arc\s*B580/i, 100, 'Arc B580'],
  [/RTX\s*5060\s*Ti/i, 125, 'RTX 5060 Ti'],
  [/RTX\s*5060/i, 100, 'RTX 5060'],
  [/RX\s*9060\s*XT/i, 125, 'RX 9060 XT'],
  [/RX\s*9070\s*GRE/i, 150, 'RX 9070 GRE'],
  [/RX\s*9070\s*XT/i, 195, 'RX 9070 XT'],
  [/RX\s*9070/i, 170, 'RX 9070'],
  [/RTX\s*5070\s*Ti/i, 220, 'RTX 5070 Ti'],
  [/RTX\s*5070/i, 160, 'RTX 5070'],
  [/RTX\s*5080/i, 270, 'RTX 5080'],
];

// [regex, puntos de rendimiento en juegos, plataforma]
// plataforma: AM4 (DDR4) · AM5 (DDR5) · LGA1851 (DDR5) · LGA1700 (DDR4 o DDR5 según la placa)
const CPU_TABLA = [
  [/Ryzen\s*5\s*5500\b/i, 78, 'AM4'],
  [/Ryzen\s*5\s*5600X\b/i, 85, 'AM4'],
  [/Ryzen\s*5\s*5600\b/i, 82, 'AM4'],
  [/Ryzen\s*7\s*5700X\b/i, 90, 'AM4'],
  [/Ryzen\s*7\s*5800XT\b/i, 97, 'AM4'],
  [/Ryzen\s*7\s*5800X\b/i, 95, 'AM4'],
  [/Ryzen\s*9\s*5900XT\b/i, 100, 'AM4'],
  [/Ryzen\s*5\s*7600X\b/i, 110, 'AM5'],
  [/Ryzen\s*7\s*7700X\b/i, 118, 'AM5'],
  [/Ryzen\s*7\s*7800X3D\b/i, 150, 'AM5'],
  [/Ryzen\s*5\s*9600X\b/i, 120, 'AM5'],
  [/Ryzen\s*7\s*9700X\b/i, 128, 'AM5'],
  [/Ryzen\s*7\s*9800X3D\b/i, 165, 'AM5'],
  [/Ryzen\s*9\s*9900X\b/i, 130, 'AM5'],
  [/Ryzen\s*9\s*9950X\b/i, 138, 'AM5'],
  [/i5-12400\b/i, 85, 'LGA1700'],
  [/i5-12600\b/i, 90, 'LGA1700'],
  [/i7-12700KF\b/i, 105, 'LGA1700'],
  [/i9-12900KF\b/i, 108, 'LGA1700'],
  [/i5-14400\b/i, 98, 'LGA1700'],
  [/i5-14500\b/i, 105, 'LGA1700'],
  [/i5-14600KF?\b/i, 118, 'LGA1700'],
  [/i7-14700\b/i, 122, 'LGA1700'],
  [/i9-14900\b/i, 128, 'LGA1700'],
  [/Core\s*Ultra\s*5\s*225\b/i, 100, 'LGA1851'],
  [/Core\s*Ultra\s*5\s*235\b/i, 105, 'LGA1851'],
  [/Core\s*Ultra\s*5\s*245KF\b/i, 112, 'LGA1851'],
  [/Core\s*Ultra\s*7\s*265\b/i, 120, 'LGA1851'],
  [/Core\s*Ultra\s*9\s*285K\b/i, 125, 'LGA1851'],
];

const PLATAFORMA_RAM = {
  AM4: ['DDR4'],
  AM5: ['DDR5'],
  LGA1851: ['DDR5'],
  LGA1700: ['DDR4', 'DDR5'],
};

// Niveles de calidad: coste relativo respecto a 1080p Alto = 1.0
const NIVELES = [
  { res: '1080p', ajuste: 'Medio', coste: 0.7, vram: 0 },
  { res: '1080p', ajuste: 'Alto', coste: 1.0, vram: 0 },
  { res: '1080p', ajuste: 'Ultra', coste: 1.25, vram: 8 },
  { res: '1440p', ajuste: 'Alto', coste: 1.6, vram: 8 },
  { res: '1440p', ajuste: 'Ultra', coste: 2.0, vram: 12 },
  { res: '4K', ajuste: 'Alto', coste: 3.2, vram: 16 },
  { res: '4K', ajuste: 'Ultra', coste: 4.0, vram: 16 },
];
const AJUSTE_EN = { Medio: 'Medium', Alto: 'High', Ultra: 'Ultra' };

// ───────────────────────── Puntuación de productos ─────────────────────────
const num = (s) => parseFloat(String(s).replace(',', '.')) || 0;

function buscar(tabla, nombre, tipo, p) {
  const fila = tabla.find((f) => f[0].test(nombre));
  if (!fila) {
    throw new Error(
      `[rendimiento] ${tipo} sin puntuar: "${p.nombre}" (id ${p.id}). Añádelo a la tabla de src/lib/rendimiento.mjs.`
    );
  }
  return fila;
}

export function puntuarGpu(p) {
  const [, puntos, chip] = buscar(GPU_TABLA, p.nombre, 'GPU', p);
  const vram = num((p.especificaciones.VRAM || '').match(/\d+/)?.[0]);
  return { puntos, chip, vram };
}

export function puntuarCpu(p) {
  const [, puntos, plataforma] = buscar(CPU_TABLA, p.nombre, 'CPU', p);
  const e = p.especificaciones;
  return { puntos, plataforma, nucleos: num(e['Núcleos']), hilos: num(e['Hilos']) };
}

export function puntuarRam(p) {
  const e = p.especificaciones;
  const tipo = /DDR5/i.test(e.Tipo || p.nombre) ? 'DDR5' : 'DDR4';
  const gb = num((e.Capacidad || '').match(/(\d+)\s*GB/i)?.[1]);
  const mhz = num((e.Velocidad || '').match(/\d+/)?.[0]);
  const cl = num((e.Latencia || p.nombre).match(/CL\s*(\d+)/i)?.[1]) || (tipo === 'DDR5' ? 36 : 18);
  if (!gb || !mhz) {
    throw new Error(`[rendimiento] RAM sin capacidad/velocidad legible: "${p.nombre}" (id ${p.id}).`);
  }
  const base = tipo === 'DDR5' ? 100 : 40;
  return { puntos: base + mhz / 100 - cl, tipo, gb, mhz, cl };
}

const CATEGORIAS_PUNTUABLES = {
  'tarjetas-graficas': puntuarGpu,
  procesadores: puntuarCpu,
  'memoria-ram': puntuarRam,
};

// Catálogo ya puntuado: { 'tarjetas-graficas': [{ p, ...puntos }], ... }
export function prepararCatalogo(productos) {
  const cat = {};
  for (const [clave, fn] of Object.entries(CATEGORIAS_PUNTUABLES)) {
    cat[clave] = productos[clave].map((p) => ({ p, ...fn(p) }));
  }
  return cat;
}

// ───────────────────────── Selección ─────────────────────────
const valor = (x) => x.puntos / x.p.precio;

// Elige la pieza más sensata para un requisito: entre las que lo cumplen con holgura (margen)
// pero sin pasarse de largo (tope: no se recomienda una GPU de 800 $ para Stardew Valley), la de
// mejor relación puntos/precio. Si el pool queda vacío se relaja el tope, y si nadie cumple se
// devuelve la de más puntos. Devuelve la lista ordenada: [elegido, ...alternativas].
function elegir(candidatos, requisito, margen = 1.15, tope = 2.5) {
  const ordenar = (l) => [...l].sort((x, y) => valor(y) - valor(x) || y.puntos - x.puntos);
  const cumplen = candidatos.filter((c) => c.puntos >= requisito * margen);
  if (!cumplen.length) return [...candidatos].sort((x, y) => y.puntos - x.puntos);
  const ajustadas = cumplen.filter((c) => c.puntos <= requisito * tope);
  // primero las ajustadas a la exigencia (por valor), luego el resto como alternativas
  return [...ordenar(ajustadas), ...ordenar(cumplen.filter((c) => !ajustadas.includes(c)))];
}

// Mayor nivel de calidad que soporta una GPU para un juego (null si ni 1080p Medio)
export function nivelSoportado(gpu, juego) {
  const margenBase = gpu.puntos / juego.gpu;
  let mejor = null;
  for (const n of NIVELES) {
    if (n.coste <= margenBase && gpu.vram >= n.vram) mejor = n;
  }
  return mejor && { ...mejor, margen: margenBase / mejor.coste };
}

function etiquetaFps(juego, margen) {
  if (juego.esports) return margen >= 1.35 ? '144+ FPS' : '100+ FPS';
  return margen >= 1.35 ? '100+ FPS' : '60+ FPS';
}

const nombreCorto = (p) => p.nombre.replace(/\s+/g, ' ').trim();
const ref = (x) => ({ categoria: null, slug: x.p.slug, id: x.p.id, nombre: nombreCorto(x.p) });

// Recomendación completa GPU + CPU + RAM para un juego
export function recomendarParaJuego(juego, catalogo) {
  // GPU: la de mejor relación que cubre la exigencia en el nivel que pide el juego
  const objetivo = NIVELES.find((n) => n.res === juego.objetivo.res && n.ajuste === juego.objetivo.ajuste);
  const gpuLista = elegir(
    catalogo['tarjetas-graficas'].filter((g) => g.vram >= objetivo.vram),
    juego.gpu * objetivo.coste
  );
  const gpu = gpuLista[0];

  // CPU: la de mejor relación que cubre la exigencia
  const cpuLista = elegir(catalogo.procesadores, juego.cpu);
  const cpu = cpuLista[0];

  // RAM: compatible con la plataforma del CPU elegido y con la capacidad que pide el juego
  const tiposOk = PLATAFORMA_RAM[cpu.plataforma];
  const ramCand = catalogo['memoria-ram'].filter((r) => tiposOk.includes(r.tipo) && r.gb >= juego.ramGB);
  const ramLista = [...ramCand].sort((a, b) => valor(b) - valor(a) || b.puntos - a.puntos);
  const ram = ramLista[0];

  const maxGpu = nivelSoportado(gpu, juego);
  // Se muestra el nivel que pide el juego (si la GPU lo cumple); si no llega, el que sí soporta
  const nivelGpu = maxGpu.coste >= objetivo.coste ? { ...objetivo, margen: gpu.puntos / (juego.gpu * objetivo.coste) } : maxGpu;
  const nivelCpuMargen = cpu.puntos / juego.cpu;
  const fpsGpu = etiquetaFps(juego, nivelGpu.margen);
  const fpsCpu = etiquetaFps(juego, nivelCpuMargen);
  const ajusteTxt = nivelGpu.ajuste;

  const alt = (lista, n = 2) => lista.slice(1, 1 + n).map((x) => ({ ...ref(x) }));
  const recs = [];

  recs.push({
    ...ref(gpu),
    categoria: 'tarjetas-graficas',
    resolucion: nivelGpu.res,
    fps: fpsGpu,
    setting: ajusteTxt,
    razon: `${gpu.vram} GB de VRAM y rendimiento de sobra para ${juego.titulo} a ${nivelGpu.res} en ${ajusteTxt}, con la mejor relación precio/rendimiento del catálogo para ese objetivo.`,
    razonEn: `${gpu.vram} GB of VRAM and plenty of power for ${juego.tituloEn} at ${nivelGpu.res} on ${AJUSTE_EN[ajusteTxt]}, with the best price-to-performance in the catalog for that target.`,
    alternativas: alt(gpuLista).map((a) => ({ ...a, categoria: 'tarjetas-graficas' })),
  });

  const platTxt = cpu.plataforma === 'LGA1700' ? 'LGA1700' : cpu.plataforma;
  const ramNota = cpu.plataforma === 'LGA1700' ? 'DDR4 o DDR5 según tu placa' : PLATAFORMA_RAM[cpu.plataforma][0];
  const ramNotaEn = cpu.plataforma === 'LGA1700' ? 'DDR4 or DDR5 depending on your motherboard' : PLATAFORMA_RAM[cpu.plataforma][0];
  recs.push({
    ...ref(cpu),
    categoria: 'procesadores',
    resolucion: nivelGpu.res,
    fps: fpsCpu,
    setting: ajusteTxt,
    razon: `${cpu.nucleos} núcleos y ${cpu.hilos} hilos cubren lo que pide ${juego.titulo}. Plataforma ${platTxt} (${ramNota}).`,
    razonEn: `${cpu.nucleos} cores and ${cpu.hilos} threads cover what ${juego.tituloEn} demands. ${platTxt} platform (${ramNotaEn}).`,
    alternativas: alt(cpuLista).map((a) => ({ ...a, categoria: 'procesadores' })),
  });

  recs.push({
    ...ref(ram),
    categoria: 'memoria-ram',
    resolucion: nivelGpu.res,
    fps: fpsGpu,
    setting: ajusteTxt,
    razon: `${ram.gb} GB ${ram.tipo} a ${ram.mhz} MHz: cumple los ${juego.ramGB} GB que pide ${juego.titulo} y es compatible con el procesador recomendado (${platTxt}).`,
    razonEn: `${ram.gb} GB ${ram.tipo} at ${ram.mhz} MHz: meets the ${juego.ramGB} GB that ${juego.tituloEn} asks for and is compatible with the recommended processor (${platTxt}).`,
    alternativas: alt(ramLista).map((a) => ({ ...a, categoria: 'memoria-ram' })),
  });

  return recs;
}

// ───────────────────────── Fichas de producto ─────────────────────────
// Devuelve hasta 3 juegos que ese producto puede mover, con la pieza complementaria recomendada.
// `juegos`: lista de juegos con exigencias · `claveCat`: categoría del producto
export function juegosParaProducto(claveCat, producto, catalogo, juegos) {
  const x = catalogo[claveCat]?.find((c) => c.p.id === producto.id);
  let aptos; // [{ juego, res, ajuste, fps }]

  if (x && claveCat === 'tarjetas-graficas') {
    aptos = juegos
      .map((j) => {
        const n = nivelSoportado(x, j);
        return n && { juego: j, res: n.res, ajuste: n.ajuste, fps: etiquetaFps(j, n.margen), dificultad: j.gpu };
      })
      .filter(Boolean);
  } else if (x && claveCat === 'procesadores') {
    aptos = juegos
      .filter((j) => x.puntos >= j.cpu)
      .map((j) => ({
        juego: j, res: j.objetivo.res, ajuste: j.objetivo.ajuste,
        fps: etiquetaFps(j, x.puntos / j.cpu), dificultad: j.cpu,
      }));
  } else if (x && claveCat === 'memoria-ram') {
    aptos = juegos
      .filter((j) => x.gb >= j.ramGB)
      .map((j) => ({
        juego: j, res: j.objetivo.res, ajuste: j.objetivo.ajuste,
        fps: etiquetaFps(j, 1.0), dificultad: j.ramGB * 10 + j.gpu / 10,
      }));
  } else {
    // SSD y refrigeración: no limitan los FPS; se muestran juegos exigentes con su sistema ideal
    aptos = juegos.map((j) => {
      const g = recomendarParaJuego(j, catalogo)[0];
      return { juego: j, res: g.resolucion, ajuste: g.setting, fps: g.fps, dificultad: j.gpu + j.cpu / 2 };
    });
  }

  // AAA primero (salvo que el producto sea tan modesto que no mueva ninguno)
  const aaa = aptos.filter((a) => a.juego.aaa);
  const base = (aaa.length >= 3 ? aaa : aptos).sort((a, b) => b.dificultad - a.dificultad);
  if (!base.length) return { aaa: false, juegos: [] };

  // Variedad entre fichas: ventana de 9 juegos que rota según el id del producto
  const ventana = base.slice(0, 9);
  const elegidos = [];
  for (let i = 0; elegidos.length < Math.min(3, ventana.length) && i < ventana.length * 2; i++) {
    const cand = ventana[(producto.id + i * 3) % ventana.length];
    if (!elegidos.includes(cand)) elegidos.push(cand);
  }

  // Pieza complementaria: otra categoría distinta a la del producto
  const orden = ['procesadores', 'tarjetas-graficas', 'memoria-ram'];
  const juegosOut = elegidos.map((a, i) => {
    const recs = recomendarParaJuego(a.juego, catalogo);
    let comp = claveCat === 'tarjetas-graficas' ? recs.find((r) => r.categoria === 'procesadores')
      : claveCat === 'procesadores' ? recs.find((r) => r.categoria === 'tarjetas-graficas')
      : claveCat === 'memoria-ram' ? recs.find((r) => r.categoria === 'tarjetas-graficas')
      : recs.find((r) => r.categoria === orden[(producto.id + i) % 3]);
    return {
      titulo: a.juego.titulo, tituloEn: a.juego.tituloEn,
      genero: a.juego.genero, generoEn: a.juego.generoEn,
      resolucion: a.res, fps: a.fps, setting: a.ajuste,
      recomendado: { categoria: comp.categoria, slug: comp.slug, id: comp.id, nombre: comp.nombre, razon: comp.razon, razonEn: comp.razonEn },
    };
  });
  return { aaa: juegosOut.every((j) => aptos.find((a) => a.juego.titulo === j.titulo)?.juego.aaa), juegos: juegosOut };
}

// Juegos con sus recomendaciones calculadas (para las páginas del Recomendador)
export function juegosConRecomendaciones(juegos, productos) {
  const catalogo = prepararCatalogo(productos);
  return juegos.map((j) => ({ ...j, recomendaciones: recomendarParaJuego(j, catalogo) }));
}
