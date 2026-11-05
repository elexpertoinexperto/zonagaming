// Código de idioma completo (BCP 47) de cada versión del sitio: el mismo que el hreflang y og:locale.
//   español → es (genérico: toda Latinoamérica) · inglés → en-US (Estados Unidos)
// Lo usan <html lang>, el JSON-LD (inLanguage) y la auditoría tools/auditar-idioma.mjs.
export const codigoIdioma = (lang) => (lang === 'en' ? 'en-US' : 'es');
