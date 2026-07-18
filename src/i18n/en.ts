// Traducciones al inglés para la versión /en/ del sitio.
// Las URLs de categoría se traducen: /tarjetas-graficas/ ↔ /en/graphics-cards/

export type GuideBullet = { b: string; t: string };

// Slugs de categoría traducidos (clave ES → slug EN)
export const SLUG_EN: Record<string, string> = {
  'tarjetas-graficas': 'graphics-cards',
  'procesadores': 'processors',
  'memoria-ram': 'ram-memory',
  'ssd': 'ssd',
  'fuentes-de-poder': 'power-supplies',
  'refrigeracion-liquida': 'liquid-cooling',
  'refrigeracion-normal': 'air-cooling',
  'gabinetes-gamer': 'gaming-cases',
  'teclados': 'keyboards',
  'mouse': 'gaming-mice',
  'audifonos': 'headsets',
  'recomendador': 'recommender',
};

// Slug EN → clave ES (inverso)
export const SLUG_ES: Record<string, string> = Object.fromEntries(
  Object.entries(SLUG_EN).map(([es, en]) => [en, es])
);

// Convierte una ruta ES a su equivalente EN (traduce el primer segmento si es categoría)
export function toEnPath(pathname: string): string {
  if (pathname === '/en' || pathname.startsWith('/en/')) return pathname;
  const segs = pathname.split('/');
  if (segs[1] && SLUG_EN[segs[1]]) segs[1] = SLUG_EN[segs[1]];
  const joined = segs.join('/');
  return joined === '/' ? '/en/' : `/en${joined}`;
}

// Convierte una ruta EN a su equivalente ES
export function toEsPath(pathname: string): string {
  if (pathname !== '/en' && !pathname.startsWith('/en/')) return pathname;
  const stripped = pathname.replace(/^\/en/, '') || '/';
  const segs = stripped.split('/');
  if (segs[1] && SLUG_ES[segs[1]]) segs[1] = SLUG_ES[segs[1]];
  return segs.join('/');
}

export type CategoryEn = {
  label: string;
  cardDescription: string;
  icon: string;
  pageTitle: string;
  metaDescription: string;
  heroTitle: string;
  heroDescription: string;
  bsTitle: string;
  backLabel: string;
  guide: {
    title: string;
    intro: string;
    bullets: GuideBullet[];
    outro: string;
  };
};

export const CATS_EN: Record<string, CategoryEn> = {
  'tarjetas-graficas': {
    label: 'Graphics cards',
    cardDescription: 'Visual power for gaming and editing.',
    icon: 'gpu',
    pageTitle: 'Graphics Cards for PC Gaming | Monckey Gamer',
    metaDescription: 'The best graphics cards for PC gaming: 1080p, 1440p and 4K. NVIDIA and AMD video cards at the best price with Amazon shipping.',
    heroTitle: 'Graphics Cards',
    heroDescription: 'The best graphics cards and video cards for gaming, streaming and rendering. Find the ideal GPU for your gaming PC with the best performance-to-price ratio.',
    bsTitle: 'Best-selling Graphics Cards',
    backLabel: 'Back to Graphics Cards',
    guide: {
      title: 'How to choose your PC graphics card?',
      intro: 'The graphics card is the most important component for gaming. Whether you are after a video card for competitive 1080p or a high-end PC graphics card for 4K, these are the factors that define your choice:',
      bullets: [
        { b: 'VRAM:', t: '8 GB for 1080p graphics cards, 12 GB or more for 1440p and 4K.' },
        { b: 'Target resolution:', t: 'do not invest in a high-end video card if you play at Full HD.' },
        { b: 'DLSS (NVIDIA) and FSR (AMD):', t: 'technologies that boost your graphics card performance without losing visual quality.' },
        { b: 'Ray tracing:', t: 'demanding on any video card; prioritize high framerates in competitive play.' },
        { b: 'Power supply:', t: 'make sure it has the connectors and wattage your graphics card TDP requires.' },
      ],
      outro: 'Every PC graphics card in our catalog ships directly from Amazon, with warranty and hassle-free returns.',
    },
  },
  'procesadores': {
    label: 'Processors',
    cardDescription: 'CPUs for multitasking and extreme performance.',
    icon: 'cpu',
    pageTitle: 'PC Processors for Gaming | Monckey Gamer',
    metaDescription: 'The best PC processors for gaming: AMD Ryzen and Intel Core. High-performance computer CPUs at the best price with Amazon shipping.',
    heroTitle: 'Processors ',
    heroDescription: 'The best PC processors for gaming, streaming and multitasking. Find the ideal computer CPU for your build with the best performance-to-price ratio.',
    bsTitle: 'Best-selling PC Processors',
    backLabel: 'Back to Processors',
    guide: {
      title: 'How to choose your gaming PC processor?',
      intro: 'The PC processor is the brain of your build: it determines how many tasks you can run at once and how fast your system responds. Whether you want a computer CPU for competitive gaming or content creation, these are the key factors:',
      bullets: [
        { b: 'Frequency (GHz):', t: 'for pure gaming PC processors, a high clock matters more than the core count.' },
        { b: 'Cores and threads:', t: '6–8 cores are enough for gaming; 12 or more if your computer CPU also handles streaming or editing.' },
        { b: 'AMD Ryzen vs Intel Core:', t: 'both brands offer competitive PC processors; choose based on your motherboard and budget.' },
        { b: 'Socket:', t: 'check AM5 (AMD) or LGA1700/1851 (Intel) before buying your PC processor.' },
        { b: 'L3 cache:', t: 'a large L3 cache improves FPS in games; compare it when evaluating computer CPUs.' },
      ],
      outro: 'Every PC processor in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'memoria-ram': {
    label: 'RAM memory',
    cardDescription: 'Speed and capacity for your builds.',
    icon: 'ram',
    pageTitle: 'RAM Memory for PC Gaming | Monckey Gamer',
    metaDescription: 'The best RAM for PC gaming: high-performance DDR4 and DDR5. RAM sticks with real speed at the best price with Amazon shipping.',
    heroTitle: 'RAM Memory',
    heroDescription: 'The best RAM memory for gaming, streaming and multitasking. Find your ideal DDR4 or DDR5 RAM kit with the best performance-to-price ratio for your PC.',
    bsTitle: 'Best-selling RAM Memory',
    backLabel: 'Back to RAM Memory',
    guide: {
      title: 'How to choose your gaming RAM?',
      intro: 'RAM determines the overall smoothness of your PC and in-game loading times. Whether you want a budget RAM stick or a high-speed DDR5 module, these are the key factors:',
      bullets: [
        { b: 'Capacity:', t: '16 GB of RAM is the recommended minimum for gaming; 32 GB if you combine games with streaming or editing.' },
        { b: 'DDR4 vs DDR5:', t: 'DDR5 RAM is the current standard; DDR4 is still valid and affordable on older platforms.' },
        { b: 'Dual channel:', t: 'always install your RAM in pairs to take advantage of double the bandwidth.' },
        { b: 'Speed and latency:', t: 'the frequency (MHz) and CL of your RAM stick matter especially on AMD Ryzen platforms.' },
        { b: 'XMP / EXPO:', t: 'enable this profile in the BIOS so your RAM runs at its full advertised speed.' },
      ],
      outro: 'All the RAM in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'ssd': {
    label: 'SSD',
    cardDescription: 'Fast storage for games and apps.',
    icon: 'ssd',
    pageTitle: 'SSDs for PC Gaming | Monckey Gamer',
    metaDescription: 'The best SSDs for PC gaming: high-speed NVMe and SATA. SSD storage at the best price with Amazon shipping to load your games in seconds.',
    heroTitle: 'SSD',
    heroDescription: 'The best SSDs and SSD storage for gaming, streaming and productivity. Find your ideal NVMe or SATA drive with the best speed-to-price ratio for your PC.',
    bsTitle: 'Best-selling SSDs',
    backLabel: 'Back to SSDs',
    guide: {
      title: 'How to choose your gaming SSD?',
      intro: 'An SSD eliminates loading times and makes your PC respond instantly. Whether you want a high-speed NVMe SSD or a budget SATA drive, these are the key factors:',
      bullets: [
        { b: 'NVMe PCIe 4.0:', t: 'the fastest SSD storage on the market, reaching 7,000 MB/s; ideal for your OS and main games.' },
        { b: 'Capacity:', t: '1 TB of SSD is the practical minimum today; AAA games take between 50 and 150 GB each.' },
        { b: 'SATA SSD:', t: 'good enough as secondary storage and the most affordable SSD option.' },
        { b: 'PCIe 5.0:', t: 'it exists, but the real difference in gaming does not justify the extra cost over a good PCIe 4.0 SSD.' },
        { b: 'Compatibility:', t: 'check that your motherboard has a compatible M.2 slot before buying your NVMe SSD.' },
      ],
      outro: 'Every SSD in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'fuentes-de-poder': {
    label: 'Power supplies',
    cardDescription: 'Stable, efficient power for your PC.',
    icon: 'psu',
    pageTitle: 'Power Supplies for PC Gaming | Monckey Gamer',
    metaDescription: 'The best PC power supplies: 80+ certified, modular and efficient. PC PSUs at the best price with Amazon shipping.',
    heroTitle: 'Power Supplies',
    heroDescription: 'The best PC power supplies, modular and 80+ certified. Find your ideal PC PSU to protect your build and deliver clean, stable power.',
    bsTitle: 'Best-selling Power Supplies',
    backLabel: 'Back to Power Supplies',
    guide: {
      title: 'How to choose your PC power supply?',
      intro: 'The power supply is the component that protects your entire investment. A poor-quality PC PSU can damage your GPU, CPU or RAM. These are the key factors:',
      bullets: [
        { b: 'Wattage:', t: 'calculate your build’s total draw and add a 20–30% margin; a good PC power supply never runs at its limit.' },
        { b: '80+ certification:', t: 'Gold or better on your PC PSU guarantees higher energy efficiency and less heat.' },
        { b: 'Modular or semi-modular:', t: 'a modular power supply simplifies cabling and improves airflow inside the case.' },
        { b: 'Protections:', t: 'the PSU must include over-voltage, over-current and short-circuit protection.' },
        { b: 'Brands:', t: 'Corsair, Seasonic and be quiet! are benchmarks in PC power supplies with excellent reputation and warranty.' },
      ],
      outro: 'Every power supply in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'refrigeracion-liquida': {
    label: 'Liquid cooling',
    cardDescription: 'Quiet, high-performance cooling.',
    icon: 'aio',
    pageTitle: 'Liquid Cooling for PC Gaming | Monckey Gamer',
    metaDescription: 'The best liquid cooling for PC gaming: 240 mm and 360 mm AIOs. Quiet liquid PC cooling systems at the best price with Amazon shipping.',
    heroTitle: 'Liquid Cooling',
    heroDescription: 'The best liquid cooling for PC and AIO cooling systems. Quiet, efficient liquid cooling for gaming with overclocking and RGB.',
    bsTitle: 'Best-selling Liquid Cooling',
    backLabel: 'Back to Liquid Cooling',
    guide: {
      title: 'How to choose your PC liquid cooling?',
      intro: 'Liquid cooling is the premium option to keep temperatures low with minimal noise and a clean look. Whether you want a basic PC cooling system or liquid cooling for overclocking, these are the key factors:',
      bullets: [
        { b: 'Radiator size:', t: '240 mm is enough for mid-range CPUs; go for 360 mm if your cooling system will support heavy overclocking.' },
        { b: 'Silence:', t: 'PC liquid cooling is quieter than most high-performance air coolers.' },
        { b: 'Installation:', t: 'mount the radiator of your liquid cooling system in exhaust positions to expel heat from the case efficiently.' },
        { b: 'Socket compatibility:', t: 'verify your liquid cooler supports your AM5, LGA1700 or other socket before buying.' },
        { b: 'Space:', t: 'liquid cooling is ideal for compact cases where a tower air cooler simply does not fit.' },
      ],
      outro: 'Every PC cooling system in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'refrigeracion-normal': {
    label: 'Air cooling',
    cardDescription: 'Reliable fans for your tower.',
    icon: 'fan',
    pageTitle: 'CPU Air Coolers for PC Gaming | Monckey Gamer',
    metaDescription: 'The best CPU air coolers for PC: tower heatsinks and air cooling systems at the best price with Amazon shipping.',
    heroTitle: 'Air Cooling',
    heroDescription: 'The best CPU coolers and air cooling systems for gaming. Quiet, efficient tower heatsinks to keep your CPU at the optimal temperature.',
    bsTitle: 'Best-selling CPU Air Coolers',
    backLabel: 'Back to Air Cooling',
    guide: {
      title: 'How to choose your PC air cooler?',
      intro: 'A good air cooling system keeps your CPU at the optimal temperature, reduces noise and extends the life of your components. These are the key factors:',
      bullets: [
        { b: 'Twin tower:', t: 'twin-tower air coolers rival 240 mm AIOs in performance at a lower cost.' },
        { b: 'No leaks:', t: 'unlike liquid cooling, an air cooling system has no pumps or tubes that can fail.' },
        { b: 'Height:', t: 'check your case’s maximum clearance before choosing a tower air cooler.' },
        { b: 'Thermal paste:', t: 'most air cooling systems include quality thermal paste in the box.' },
        { b: 'Maintenance:', t: 'an air cooler only needs occasional cleaning; ideal if you prioritize durability.' },
      ],
      outro: 'Every cooling system in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'gabinetes-gamer': {
    label: 'Gaming cases',
    cardDescription: 'Looks, airflow and room for your setup.',
    icon: 'box',
    pageTitle: 'Gaming PC Cases | Monckey Gamer',
    metaDescription: 'The best gaming PC cases: mid-tower and full-tower with airflow, tempered glass and RGB. PC cases at the best price with Amazon shipping.',
    heroTitle: 'Gaming Cases',
    heroDescription: 'The best gaming cases and PC cases with maximum airflow, tempered glass panels and room for powerful builds. Find the ideal case for your setup.',
    bsTitle: 'Best-selling Gaming Cases',
    backLabel: 'Back to Gaming Cases',
    guide: {
      title: 'How to choose your gaming PC case?',
      intro: 'The gaming case defines the airflow, space and looks of your entire build. Whether you want a compact PC case or a full-size tower, these are the key factors:',
      bullets: [
        { b: 'Airflow first:', t: 'a gaming case with good airflow keeps temperatures lower than any cooler on its own.' },
        { b: 'Compatibility:', t: 'verify your PC case supports your board size (ATX/mATX), GPU length and cooler height.' },
        { b: 'Mid-tower format:', t: 'the most versatile gaming case for most builds; it balances space and size.' },
        { b: 'Tempered glass:', t: 'a PC case with a clear panel lets you show off your components’ RGB lighting.' },
        { b: 'Cable management:', t: 'look for a gaming case with generous rear space to keep cabling tidy and airflow unobstructed.' },
      ],
      outro: 'Every gaming case in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'teclados': {
    label: 'Keyboards',
    cardDescription: 'Mechanical and RGB peripherals for every kind of player.',
    icon: 'keyboard',
    pageTitle: 'Mechanical Gaming Keyboards | Monckey Gamer',
    metaDescription: 'The best mechanical and RGB gaming keyboards. Gaming keyboards with premium switches and precise response at the best price with Amazon shipping.',
    heroTitle: 'Keyboards',
    heroDescription: 'The best mechanical gaming keyboards with RGB lighting and fast switches. Find your ideal gaming keyboard for competitive play and every playstyle.',
    bsTitle: 'Best-selling Gaming Keyboards',
    backLabel: 'Back to Keyboards',
    guide: {
      title: 'How to choose your gaming keyboard?',
      intro: 'The gaming keyboard is your main control tool in every match. Whether you want a high-performance mechanical gaming keyboard or a budget option, these factors make the difference:',
      bullets: [
        { b: 'Linear switches (Red):', t: 'the fastest gaming keyboard for action games; smooth presses with no tactile bump.' },
        { b: 'Tactile switches (Brown):', t: 'a gaming keyboard with noticeable feedback and no excessive noise, ideal for mixed gaming and typing.' },
        { b: 'TKL format:', t: 'a gaming keyboard without a numpad frees up desk space and gives your mouse more room to move.' },
        { b: 'Hot-swappable:', t: 'lets you change your keyboard’s switches without soldering; ideal for customizing.' },
        { b: 'Polling rate:', t: '1,000 Hz is the standard on gaming keyboards; enough for any competitive level.' },
      ],
      outro: 'Every gaming keyboard in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'mouse': {
    label: 'Mice',
    cardDescription: 'Precision and ergonomics for competitive play.',
    icon: 'mouse',
    pageTitle: 'High-Precision Gaming Mice | Monckey Gamer',
    metaDescription: 'The best optical and ergonomic gaming mice for competitive gaming. Gaming mice with precision sensors at the best price with Amazon shipping.',
    heroTitle: 'Mice',
    heroDescription: 'The best gaming mice for competitive gaming. High-precision optical sensors, ergonomic design and maximum speed for every kind of player.',
    bsTitle: 'Best-selling Gaming Mice',
    backLabel: 'Back to Mice',
    guide: {
      title: 'How to choose your gaming mouse?',
      intro: 'The right gaming mouse makes a difference in precision, speed and comfort over hours of play. Whether you want a lightweight mouse for FPS or an ergonomic one for long sessions, these are the key factors:',
      bullets: [
        { b: 'Optical sensor:', t: 'the standard in every competitive gaming mouse; consistent response on any surface with no acceleration.' },
        { b: 'DPI:', t: 'high DPI alone does not improve your aim; what matters is the sensor’s consistency and precision.' },
        { b: 'Grip:', t: 'choose your gaming mouse based on your style — palm grip, claw or fingertip.' },
        { b: 'Wireless:', t: 'modern wireless gaming mice have imperceptible latency; you do not sacrifice competitive performance.' },
        { b: 'Weight:', t: 'a 60–90 g gaming mouse favors speed in FPS; heavier models offer more control in RTS and MMO.' },
      ],
      outro: 'Every gaming mouse in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
  'audifonos': {
    label: 'Headsets',
    cardDescription: 'Immersive sound for your matches and streams.',
    icon: 'audio',
    pageTitle: 'Gaming Headsets with 7.1 Sound | Monckey Gamer',
    metaDescription: 'The best gaming headsets with 7.1 sound and a crisp microphone. Gaming headphones at the best price with Amazon shipping.',
    heroTitle: 'Headsets',
    heroDescription: 'The best gaming headsets and headphones with surround sound, noise-cancelling microphones and comfort for long gaming sessions.',
    bsTitle: 'Best-selling Gaming Headsets',
    backLabel: 'Back to Headsets',
    guide: {
      title: 'How to choose your gaming headset?',
      intro: 'A good gaming headset improves immersion and sound positioning in competitive matches. Whether you want a headset for FPS or gaming headphones for total immersion, these are the key factors:',
      bullets: [
        { b: 'Closed-back design:', t: 'closed-back gaming headsets isolate you from the environment; ideal for noisy rooms and competitive gaming.' },
        { b: 'Open-back design:', t: 'open gaming headphones offer a wider, more natural soundstage; better for single-player experiences.' },
        { b: 'Virtual 7.1 sound:', t: 'headsets with 7.1 help you locate footsteps and shots by direction in FPS; a real competitive advantage.' },
        { b: '50 mm drivers:', t: 'gaming headsets with large drivers deliver better bass response for impact effects and explosions.' },
        { b: 'Microphone:', t: 'headsets with noise cancellation are essential for streaming or team communication.' },
      ],
      outro: 'Every gaming headset in our catalog ships directly from Amazon, with official warranty and hassle-free returns.',
    },
  },
};

export const UI_EN = {
  nav: {
    home: 'Home',
    components: 'Components',
    recommender: 'Recommender',
    blog: 'Blog',
    contact: 'Contact',
  },
  footer: {
    tagline1: 'The perfect setup',
    tagline2: 'starts here.',
    desc: 'Hand-picked PC gaming components. Fast shipping via Amazon.',
    badge: 'Store active · 24/7',
    catalogs: 'Catalogs',
    info: 'Information',
    contact: 'Contact',
    sitemap: 'Site map',
    made: 'Made for gamers, by gamers',
  },
  product: {
    details: 'Details',
    imageOf: 'Image of',
    specifications: 'Specifications',
    price: 'Price',
    viewOnAmazon: 'View on Amazon',
    topSellers: 'Top sellers',
  },
  comparador: {
    eyebrow: 'Tool',
    title: 'Product comparator',
    category: 'Category',
    chooseCategory: '— Choose a category —',
    productA: 'Product A',
    productB: 'Product B',
    chooseProduct: '— Choose a product —',
    selectProduct: 'Select a product',
    comparison: 'Comparison',
    sideBySide: 'Specs side by side',
    specification: 'Specification',
    bestPrice: 'Best price',
  },
};

export const BLOG_EN = {
  pageTitle: 'Blog | Monckey Gamer',
  metaDescription: 'Easy, straight-to-the-point gamer guides about PC components. Learn to choose your hardware and build the perfect setup without the hassle.',
  eyebrow: 'Blog',
  heroTitle: 'Learn about gaming hardware',
  heroDescription: 'Simple, direct guides to understand your PC components and make better buying decisions.',
  readArticle: 'Read article →',
  readTime: 'read',
  backToBlog: '← Back to Blog',
};

export const ARTICLES_EN = [
  {
    titulo: 'Benefits of a wireless gaming headset',
    resumen: 'Freedom of movement, no perceptible latency and battery life for long sessions. Why gamers are switching to wireless in 2026.',
    href: '/en/blog/beneficios-audifono-gamer-inalambrico/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'What makes a gaming headset comfortable?',
    resumen: 'Ear pads, weight, headband and clamping force: the features that decide whether you can wear it for 4 hours straight or take it off after minutes.',
    href: '/en/blog/que-debe-tener-un-audifono-gamer-para-ser-comodo/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '5 min',
  },
  {
    titulo: 'What grip styles are there for a gaming mouse?',
    resumen: 'Palm, claw or fingertip: your grip style determines which mouse shape gives you more control and less fatigue. Find out which one is yours.',
    href: '/en/blog/tipos-de-agarre-para-mouse-gamer/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'Does a wireless gaming mouse have latency issues?',
    resumen: 'Modern wireless mice with a 2.4GHz receiver no longer lag. Find out why today’s technology matches the cable in competitive gaming.',
    href: '/en/blog/mouse-gamer-inalambrico-tiene-lag/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'Why does a lightweight gaming mouse matter?',
    resumen: 'Weight affects precision, fatigue and competitive performance. A guide to how much your mouse should weigh depending on the genre you play.',
    href: '/en/blog/por-que-importa-el-peso-del-mouse-gamer/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'Which switches feel most satisfying for typing?',
    resumen: 'Tactile, clicky or linear: the guide to finding the switch that feels best based on how you type and play.',
    href: '/en/blog/que-switches-son-mas-satisfactorios-para-escribir/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'Which switches are the quietest on a gaming keyboard?',
    resumen: 'A quiet-switch guide for mechanical keyboards: silent linears, click-free tactiles and the extra factors that reduce total keyboard noise.',
    href: '/en/blog/que-switches-suenan-menos-teclado-gamer/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'Wired or wireless gaming keyboard?',
    resumen: '2.4GHz wireless keyboard latency now matches the cable. A guide to choosing based on how you play, your budget and your desk.',
    href: '/en/blog/teclado-gamer-cable-o-inalambrico/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'What types of gaming keyboards are there?',
    resumen: 'Mechanical, membrane or optical: what the difference is, which formats exist and which one suits your playstyle and budget.',
    href: '/en/blog/tipos-de-teclado-gamer/',
    tag: 'Peripherals',
    fecha: 'June 12, 2026',
    tiempoLectura: '5 min',
  },
  {
    titulo: 'What to look for when buying a gaming case',
    resumen: 'Size, airflow, compatibility and materials: the guide to picking the right case before building your PC — no surprises.',
    href: '/en/blog/que-tener-en-cuenta-para-comprar-gabinete-gamer/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '5 min',
  },
  {
    titulo: 'Liquid cooling vs air cooler: which is better?',
    resumen: 'The honest AIO vs tower comparison: temperatures, noise, price and ease of installation so you choose right for your build.',
    href: '/en/blog/refrigeracion-liquida-vs-cooler-de-aire/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '5 min',
  },
  {
    titulo: 'How to tell if a liquid cooler is quiet',
    resumen: 'Which specs to look at, the dB numbers that matter and the quietest AIOs on the market for gaming.',
    href: '/en/blog/como-saber-si-refrigeracion-liquida-es-silenciosa/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'How to install a liquid cooler (AIO)',
    resumen: 'Step-by-step guide to installing an AIO: required tools, radiator orientation, common mistakes and basic maintenance.',
    href: '/en/blog/como-instalar-una-refrigeracion-liquida/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '6 min',
  },
  {
    titulo: 'What does RAM latency do? CL explained for gamers',
    resumen: 'CAS latency determines how fast your memory responds. A guide to understanding CL, nanoseconds and how to enable XMP/EXPO so you don’t lose performance.',
    href: '/en/blog/que-hace-la-latencia-en-ram/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'What does DDR mean in RAM? DDR4 vs DDR5',
    resumen: 'DDR4 or DDR5: what each one is, which suits your platform, the speed differences and why dual channel always wins.',
    href: '/en/blog/que-es-el-ddr-en-memoria-ram/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '5 min',
  },
  {
    titulo: 'What are CPU cores and threads for?',
    resumen: 'Cores and threads explained for gamers: what they mean, how many you need in 2026 and why frequency matters more than core count.',
    href: '/en/blog/nucleos-e-hilos-en-un-procesador/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '5 min',
  },
  {
    titulo: 'Why does bus speed matter on a graphics card?',
    resumen: 'Bus speed defines your GPU’s bandwidth. Find out how GDDR7 can outperform GDDR5 with twice the bits.',
    href: '/en/blog/que-es-la-velocidad-bus-en-tarjeta-grafica/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'What is the bus width on a graphics card?',
    resumen: 'The memory bus defines how much data your GPU moves at once. Quick guide: what bits are, why they matter and which number to pick for your resolution.',
    href: '/en/blog/que-es-el-ancho-de-bus-en-una-tarjeta-grafica/',
    tag: 'Hardware',
    fecha: 'June 12, 2026',
    tiempoLectura: '4 min',
  },
  {
    titulo: 'What is VRAM on a graphics card?',
    resumen: 'What it is, what it’s for, how much you need, the types that exist and how it differs from RAM. Explained the easy way for gamers.',
    href: '/en/blog/que-es-la-vram/',
    tag: 'Hardware',
    fecha: 'June 9, 2026',
    tiempoLectura: '5 min',
  },
];
