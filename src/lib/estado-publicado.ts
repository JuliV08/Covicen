// Solo build. ¿Se publica el estado de la traza en vivo, y contra qué dirección? Lo usan /el-tramo/ y /obras/.
// Hacen falta los dos interruptores: la capacidad (que la API del sistema exista) y la decisión de publicarlo.
import { config } from '@/lib/config';
import { capacidades } from '@/lib/datos/capacidades';
import { publicado } from '@/lib/publicado';

/** La dirección de GET /api/v1/estado-ruta/ que consulta el navegador, o `null` si el estado no se publica. Prendido y
 *  sin PUBLIC_API_URL, el build se frena: publicaría un bloque que nunca carga, y eso se ve como una falla. */
export const urlEstadoEnVivo = (): string | null => {
  if (!capacidades.estadoRutasEnVivo || !publicado.estadoDeLaTraza) return null;
  if (!config.apiPublicaUrl) throw new Error('El estado de la traza en vivo necesita PUBLIC_API_URL');
  return `${config.apiPublicaUrl}/api/v1/estado-ruta/`;
};
