import type { ZodType } from 'astro/zod';
import { config } from '@/lib/config';
import { esquemaTarifario, esquemaTramo } from '../esquemas';
import type { FuenteDatos } from '../fuente';

// Acá está Django. Cada método hace fetch + esquemaX.parse: el contrato manda.
// Lo que el sistema todavía no tiene (empresa, contacto, obras, novedades, FAQ, estado de rutas)
// NO se implementa acá: index.ts lo sigue leyendo del repo. Esta fuente no simula nada.
async function leer<T>(ruta: string, esquema: ZodType<T>): Promise<T> {
  const url = `${config.apiUrl}${ruta}`;
  let respuesta: Response;
  try {
    respuesta = await fetch(url, { headers: { Accept: 'application/json' } });
  } catch (e) {
    throw new Error(`FuenteApi: no se pudo conectar a ${url} (${(e as Error).message}). No se publica la web sin datos.`);
  }
  if (!respuesta.ok) {
    throw new Error(`FuenteApi: ${ruta} respondió ${respuesta.status}. No se publica la web sin datos válidos.`);
  }
  const resultado = esquema.safeParse(await respuesta.json());
  if (!resultado.success) {
    const detalle = resultado.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`FuenteApi: la respuesta de ${ruta} no cumple el contrato:\n${detalle}`);
  }
  return resultado.data;
}

export const fuenteApi: Pick<FuenteDatos, 'tramo' | 'tarifario'> = {
  tramo: () => leer('/api/v1/tramo/', esquemaTramo),
  tarifario: () => leer('/api/v1/tarifario/', esquemaTarifario),
};
