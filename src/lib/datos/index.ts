// Punto de entrada único. Los componentes importan `datos` de acá y de ningún otro lado.
import { config } from '@/lib/config';
import type { FuenteDatos } from './fuente';
import { fuenteApi } from './fuentes/api';
import { fuenteLocalJson } from './fuentes/local-json';

// `astro:content` se importa de forma diferida para que `datos` sea importable en Vitest
// y para que ninguna página pague ese módulo si no lista novedades.
const fuenteLocal: FuenteDatos = {
  ...fuenteLocalJson,
  novedades: async () => (await import('./fuentes/local-novedades')).novedadesLocal(),
  novedad: async (slug) => (await import('./fuentes/local-novedades')).novedadLocal(slug),
};

// FUENTE_DATOS=api: la API del sistema para lo que ya existe (tramo, tarifario); el repo para el
// resto. Nada se simula: lo que la API no tiene, sigue versionado acá hasta que exista su sistema.
export const datos: FuenteDatos =
  config.fuenteDatos === 'api' ? { ...fuenteLocal, ...fuenteApi } : fuenteLocal;
export { capacidades } from './capacidades';
export type * from './esquemas';
