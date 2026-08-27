import type { FuenteDatos } from '../fuente';

// Acá va Django. Cada método hará fetch + esquemaX.parse(...) contra el contrato de esquemas.ts.
// No es un mock: lanza. Si alguien lo selecciona por error, el build rompe con un mensaje claro.
const noImplementado = (metodo: string) => async (): Promise<never> => {
  throw new Error(`FuenteApi: no implementado (${metodo}). Usá FUENTE_DATOS=local.`);
};

export const fuenteApi: FuenteDatos = {
  empresa: noImplementado('empresa'),
  contacto: noImplementado('contacto'),
  tramo: noImplementado('tramo'),
  tarifario: noImplementado('tarifario'),
  obras: noImplementado('obras'),
  novedades: noImplementado('novedades'),
  novedad: noImplementado('novedad'),
  faq: noImplementado('faq'),
  estadoRutas: noImplementado('estadoRutas'),
};
