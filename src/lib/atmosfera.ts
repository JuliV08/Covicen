// Imágenes fotográficas opcionales en src/assets/atmosfera/. Si el archivo no existe, devuelve undefined
// y los componentes renderizan su versión sin foto: el layout está terminado con o sin ellas.
import type { ImageMetadata } from 'astro';

const todas = import.meta.glob<{ default: ImageMetadata }>('/src/assets/atmosfera/*.{jpg,jpeg,png,webp,avif}', { eager: true });

export const imagenAtmosfera = (nombre: string): ImageMetadata | undefined =>
  Object.entries(todas).find(([ruta]) => ruta.replace(/^.*\//, '').replace(/\.[^.]+$/, '') === nombre)?.[1].default;
