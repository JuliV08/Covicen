// Imágenes fotográficas opcionales en src/assets/atmosfera/. Si el archivo no existe, devuelve undefined
// y los componentes renderizan su versión sin foto: el layout está terminado con o sin ellas.
import type { ImageMetadata } from 'astro';
import { TEMA_POR_DEFECTO, type PreferenciaTema } from '@/lib/tema';

const todas = import.meta.glob<{ default: ImageMetadata }>('/src/assets/atmosfera/*.{jpg,jpeg,png,webp,avif}', { eager: true });

export const imagenAtmosfera = (nombre: string): ImageMetadata | undefined =>
  Object.entries(todas).find(([ruta]) => ruta.replace(/^.*\//, '').replace(/\.[^.]+$/, '') === nombre)?.[1].default;

export type VarianteHero = { nombre: string; clase: '' | 'solo-oscuro' | 'solo-claro'; prioridad: boolean };

/** Qué fotos renderiza el hero: ninguna (vector), una sola si no hay versión de día, o una por tema si la hay.
 *  La del tema por defecto carga con prioridad; la otra, lazy y oculta hasta que el usuario cambie de tema. */
export const variantesHero = (hayNoche: boolean, hayDia: boolean, porDefecto: PreferenciaTema = TEMA_POR_DEFECTO): VarianteHero[] => {
  if (!hayNoche) return [];
  if (!hayDia) return [{ nombre: 'hero-ruta-nocturna', clase: '', prioridad: true }];
  const claroPrimero = porDefecto === 'claro';
  return [
    { nombre: 'hero-ruta-nocturna', clase: 'solo-oscuro', prioridad: !claroPrimero },
    { nombre: 'hero-ruta-diurna', clase: 'solo-claro', prioridad: claroPrimero },
  ];
};

const institucionales = import.meta.glob<{ default: ImageMetadata }>('/src/assets/institucional/*.{jpg,jpeg,png,webp}', { eager: true });
/** Imágenes institucionales opcionales (organigrama). Sin archivo, la sección no se renderiza. */
export const imagenInstitucional = (nombre: string): ImageMetadata | undefined =>
  Object.entries(institucionales).find(([ruta]) => ruta.replace(/^.*\//, '').replace(/\.[^.]+$/, '') === nombre)?.[1].default;
