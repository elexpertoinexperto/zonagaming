// Categorías relacionadas: para cada categoría, 3 que se compran junto a ella y por qué.
// Se muestran en CategoriasRelacionadas.astro justo debajo de «más vendidos».
export type Relacion = { cat: string; es: string; en: string };

export const RELACIONES: Record<string, Relacion[]> = {
  'tarjetas-graficas': [
    { cat: 'procesadores', es: 'Un procesador a la altura evita cuellos de botella y aprovecha todos los FPS de tu tarjeta.', en: 'A well-matched processor avoids bottlenecks so your card delivers every frame.' },
    { cat: 'fuentes-de-poder', es: 'Revisa los vatios y conectores que pide tu tarjeta antes de comprarla.', en: 'Check the wattage and connectors your card requires before you buy.' },
    { cat: 'monitores', es: 'Un monitor con la resolución y los Hz correctos le saca el jugo a tu tarjeta.', en: 'A monitor with the right resolution and refresh rate gets the most from your card.' },
  ],
  procesadores: [
    { cat: 'tarjetas-graficas', es: 'Empareja tu CPU con una tarjeta equilibrada para jugar sin cuellos de botella.', en: 'Pair your CPU with a balanced card to play without bottlenecks.' },
    { cat: 'memoria-ram', es: 'El socket decide el tipo de memoria (DDR4 o DDR5): elige el kit compatible.', en: 'The socket decides the memory type (DDR4 or DDR5): choose a compatible kit.' },
    { cat: 'refrigeracion-normal', es: 'Un buen disipador mantiene tu procesador frío y silencioso bajo carga.', en: 'A good air cooler keeps your processor cool and quiet under load.' },
  ],
  'memoria-ram': [
    { cat: 'procesadores', es: 'Tu procesador define si necesitas DDR4 o DDR5 y qué velocidad aprovecha.', en: 'Your processor decides whether you need DDR4 or DDR5 and which speed it can use.' },
    { cat: 'ssd', es: 'RAM rápida más un SSD NVMe elimina tirones y acorta las cargas.', en: 'Fast RAM plus an NVMe SSD cuts stutter and shortens load times.' },
    { cat: 'tarjetas-graficas', es: 'La memoria acompaña a la tarjeta: equilibra tu equipo para jugar con fluidez.', en: 'Memory works alongside the card: balance your build for smooth play.' },
  ],
  ssd: [
    { cat: 'memoria-ram', es: 'Combina almacenamiento rápido con 16–32 GB de RAM para un sistema ágil.', en: 'Pair fast storage with 16–32 GB of RAM for a snappy system.' },
    { cat: 'procesadores', es: 'Verifica que tu plataforma soporte PCIe 4.0 o 5.0 antes de elegir el SSD.', en: 'Check that your platform supports PCIe 4.0 or 5.0 before picking an SSD.' },
    { cat: 'gabinetes-gamer', es: 'Un gabinete con buen flujo de aire evita que tu SSD se caliente y reduzca velocidad.', en: 'A case with good airflow keeps your SSD from overheating and throttling.' },
  ],
  'fuentes-de-poder': [
    { cat: 'tarjetas-graficas', es: 'La tarjeta gráfica es lo que más consume: dimensiona la fuente según ella.', en: 'The graphics card draws the most power: size your PSU around it.' },
    { cat: 'gabinetes-gamer', es: 'Verifica que el formato de la fuente (ATX o SFX) y su longitud quepan en el gabinete.', en: 'Make sure the PSU form factor (ATX or SFX) and its length fit your case.' },
    { cat: 'procesadores', es: 'Los procesadores de gama alta elevan el consumo: suma su TDP al calcular los vatios.', en: 'High-end processors raise consumption: add their TDP when sizing your PSU.' },
  ],
  'refrigeracion-liquida': [
    { cat: 'procesadores', es: 'Comprueba el socket y el TDP de tu procesador antes de elegir el radiador.', en: 'Check your processor\'s socket and TDP before choosing a radiator.' },
    { cat: 'gabinetes-gamer', es: 'El gabinete decide qué radiador (240, 280 o 360 mm) puedes instalar.', en: 'Your case decides which radiator (240, 280 or 360 mm) you can install.' },
    { cat: 'refrigeracion-normal', es: '¿Dudas entre líquida y aire? Compara con un buen disipador de torre.', en: 'Torn between liquid and air? Compare with a good tower cooler.' },
  ],
  'refrigeracion-normal': [
    { cat: 'procesadores', es: 'Revisa el socket y el TDP de tu procesador para elegir un disipador suficiente.', en: 'Check your processor\'s socket and TDP to pick a cooler that can handle it.' },
    { cat: 'gabinetes-gamer', es: 'Revisa la altura máxima de disipador que admite tu gabinete.', en: 'Check the maximum cooler height your case supports.' },
    { cat: 'refrigeracion-liquida', es: 'Si buscas más margen de enfriamiento, mira las AIO de 240 a 360 mm.', en: 'If you want more cooling headroom, take a look at 240 to 360 mm AIO coolers.' },
  ],
  'gabinetes-gamer': [
    { cat: 'refrigeracion-liquida', es: 'Aprovecha el espacio del gabinete con una AIO de 240 a 360 mm.', en: 'Use your case\'s space with a 240 to 360 mm AIO.' },
    { cat: 'fuentes-de-poder', es: 'Elige una fuente del formato y la potencia que tu gabinete y tu tarjeta piden.', en: 'Pick a PSU in the form factor and wattage your case and card call for.' },
    { cat: 'ssd', es: 'Revisa cuántas ranuras M.2 y bahías de almacenamiento ofrece y llénalas con un SSD rápido.', en: 'Check how many M.2 slots and drive bays it offers and fill them with a fast SSD.' },
  ],
  teclados: [
    { cat: 'mouse', es: 'El teclado y el mouse son el par que define tu control en cada partida.', en: 'Keyboard and mouse are the pair that defines your control in every match.' },
    { cat: 'audifonos', es: 'Completa tu zona de juego con audio posicional para escuchar a tus rivales.', en: 'Complete your setup with positional audio so you can hear your opponents.' },
    { cat: 'monitores', es: 'Un monitor de alta tasa de refresco hace que cada tecla se sienta más inmediata.', en: 'A high-refresh monitor makes every keypress feel more immediate.' },
  ],
  mouse: [
    { cat: 'teclados', es: 'Combina tu mouse con un teclado mecánico a la altura.', en: 'Match your mouse with a capable mechanical keyboard.' },
    { cat: 'monitores', es: 'Un monitor de 144 Hz o más aprovecha la precisión de tu mouse.', en: 'A 144 Hz or faster monitor takes advantage of your mouse\'s precision.' },
    { cat: 'audifonos', es: 'Escuchar bien los pasos del rival complementa tu puntería.', en: 'Hearing your rival\'s footsteps complements your aim.' },
  ],
  audifonos: [
    { cat: 'teclados', es: 'Completa tu setup con un teclado mecánico para jugar y chatear.', en: 'Complete your setup with a mechanical keyboard for gaming and chat.' },
    { cat: 'mouse', es: 'Un buen mouse y unos buenos audífonos son la mitad de tu ventaja.', en: 'A good mouse and good headphones are half of your edge.' },
    { cat: 'monitores', es: 'Imagen y sonido van juntos: elige un monitor a la altura.', en: 'Picture and sound go together: pick a monitor to match.' },
  ],
  monitores: [
    { cat: 'tarjetas-graficas', es: 'Para exprimir 1440p o 4K necesitas una tarjeta gráfica que lo mueva.', en: 'To get the most out of 1440p or 4K you need a graphics card that can drive it.' },
    { cat: 'mouse', es: 'Una tasa de refresco alta se aprovecha mejor con un mouse preciso.', en: 'A high refresh rate is best used with a precise mouse.' },
    { cat: 'teclados', es: 'Completa tu estación de juego con un teclado a la altura.', en: 'Complete your gaming station with a keyboard to match.' },
  ],
};
