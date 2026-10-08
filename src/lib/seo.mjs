// Utilidades de SEO compartidas por las páginas de producto y el layout.

// Recorta el nombre para la meta description (límite de caracteres, cortando en palabra completa).
// Se asigna en orden de id: si el texto recortado de un producto ya lo usa otro de id MENOR, se amplía el
// límite hasta que sea distinto (p. ej. variantes "Black" / "White" cuyo color queda fuera del recorte).
// El producto de menor id conserva su texto de siempre, así las URLs ya indexadas no cambian.
export function nombreCortoUnico(producto, lista, limite = 50) {
  const cortar = (nombre, n) =>
    nombre.length > n ? nombre.slice(0, n).replace(/\s+\S*$/, '') + '…' : nombre;
  const usados = new Set();
  for (const p of [...lista].sort((a, b) => a.id - b.id)) {
    let n = limite;
    let texto = cortar(p.nombre, n);
    while (n < p.nombre.length && usados.has(texto)) {
      n += 6;
      texto = cortar(p.nombre, n);
    }
    usados.add(texto);
    if (p.id === producto.id) return texto;
  }
  return cortar(producto.nombre, limite);
}
