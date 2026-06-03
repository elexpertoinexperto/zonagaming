export interface Producto {
  id: number;
  slug: string;
  nombre: string;
  descripcion: string;
  especificaciones: Record<string, string>;
  precio: number;
  enlaceAmazon: string;
  imagenUrl?: string;
  imagenAboveFold?: boolean;
  imagenProducto?: string;
  imagenAlt?: string;
}
