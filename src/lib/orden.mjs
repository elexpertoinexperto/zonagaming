// Orden de los listados: los productos con imagen real van primero y los que muestran «Imagen no disponible» al final.
// Es estable: dentro de cada grupo se conserva el orden original (en las categorías, el del catálogo; en las subcategorías, el precio).
export const tieneImagen = (p) => !String(p?.imagenUrl ?? '').includes('placeholder');

export function conImagenPrimero(lista) {
  return [...lista.filter(tieneImagen), ...lista.filter((p) => !tieneImagen(p))];
}
