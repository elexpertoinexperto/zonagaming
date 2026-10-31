// ¿Qué es una «gráfica de entrada»? Clasificación de cada tarjeta gráfica del catálogo por su RENDIMIENTO real (índice de rendimiento.mjs,
// donde la RTX 5060 vale 100) y no por su precio, que en una tienda cambia cada semana:
//   · Entrada  — hasta 100 puntos (igual o por debajo de la RTX 5060): 1080p, de ajustes bajos a altos según el modelo.
//   · Gama media — de 101 a 170 puntos: 1080p alto y 1440p.
//   · Gama alta — más de 170 puntos: 1440p alto y 4K con reescalado.
// Dentro de «entrada» se distingue la RECOMENDADA (80–100 pts, generación actual), la BÁSICA (51–80 pts) y la MÍNIMA (hasta 50 pts, solo esports).
// Lo usan el análisis de cada ficha (analisis.mjs) y el bloque «Gráficas de entrada» de la categoría (GuiaEntradaGpu.astro).
import { puntuarGpu } from './rendimiento.mjs';

export const LIMITE_ENTRADA = 100;
export const LIMITE_MEDIA = 170;

// Chips de generaciones anteriores a la actual (RTX 50 / RX 9000 / Arc B)
const ANTERIOR = /^(GTX|RX 5\d\d$|RX 6|RX 7|Arc A|RTX 20|RTX 30|RTX 40)/;

export function nivelGpu(p) {
  const { puntos, chip, vram } = puntuarGpu(p);
  const nivel = puntos <= LIMITE_ENTRADA ? 'entrada' : puntos <= LIMITE_MEDIA ? 'media' : 'alta';
  const anterior = ANTERIOR.test(chip);
  const grado = nivel !== 'entrada' ? null : puntos <= 50 ? 'minima' : puntos <= 80 ? 'basica' : 'recomendada';
  const res = puntos >= 190
    ? { es: '1440p en ajustes altos y 4K con reescalado', en: '1440p at high settings and 4K with upscaling' }
    : puntos >= 120 ? { es: '1440p en ajustes altos', en: '1440p at high settings' }
    : puntos >= 90 ? { es: '1080p en ajustes altos', en: '1080p at high settings' }
    : puntos >= 60 ? { es: '1080p en ajustes medios', en: '1080p at medium settings' }
    : { es: 'esports y títulos ligeros en 1080p', en: 'esports and light titles at 1080p' };

  const clases = {
    recomendada: { es: 'una gráfica de entrada recomendada', en: 'a recommended entry-level graphics card', etiqueta: { es: 'Entrada recomendada', en: 'Recommended entry-level' } },
    basica: { es: 'una gráfica de entrada básica', en: 'a basic entry-level graphics card', etiqueta: { es: 'Entrada básica', en: 'Basic entry-level' } },
    minima: { es: 'una gráfica de entrada muy básica', en: 'a bare-bones entry-level graphics card', etiqueta: { es: 'Entrada mínima (esports)', en: 'Bare-minimum entry (esports)' } },
  };
  const clase = grado ? clases[grado]
    : nivel === 'media' ? { es: 'una gráfica de gama media', en: 'a mid-range graphics card', etiqueta: { es: 'Gama media', en: 'Mid-range' } }
    : { es: 'una gráfica de gama alta', en: 'a high-end graphics card', etiqueta: { es: 'Gama alta', en: 'High-end' } };

  // La explicación concreta de por qué cumple (o no) como gráfica de entrada, con sus números
  const pts = Math.round(puntos);
  const porque = {
    es: nivel === 'entrada'
      ? `Sí es una gráfica de entrada: rinde ${pts} puntos en nuestro índice (el tope de la entrada es ${LIMITE_ENTRADA}, el de la RTX 5060), con ${vram} GB de VRAM, para ${res.es}${anterior ? '. Es de una generación anterior: por eso suele costar menos, pero sin las tecnologías más recientes' : ''}.`
      : `No es una gráfica de entrada: con ${pts} puntos supera el tope de ${LIMITE_ENTRADA} de la entrada (la RTX 5060). Es ${nivel === 'media' ? 'de gama media' : 'de gama alta'}, pensada para ${res.es}.`,
    en: nivel === 'entrada'
      ? `Yes, it is an entry-level card: it scores ${pts} points on our index (the entry-level ceiling is ${LIMITE_ENTRADA}, the RTX 5060), with ${vram} GB of VRAM, for ${res.en}${anterior ? '. It is from a previous generation: that is why it tends to cost less, but it lacks the latest technologies' : ''}.`
      : `No, it is not an entry-level card: at ${pts} points it is above the ${LIMITE_ENTRADA}-point entry ceiling (the RTX 5060). It is ${nivel === 'media' ? 'mid-range' : 'high-end'}, aimed at ${res.en}.`,
  };
  return { nivel, grado, anterior, puntos, chip, vram, res, clase, porque };
}
