// Consulta en vivo del estado de la traza (spec del sistema 3, §8.6). Corre en el navegador.
//
// No importa Zod: mandarlo al navegador multiplicaría el JS de toda la web por un solo control. La validación es la del
// contrato (esquemaEstadoRuta), escrita a mano, y tests/lib/estado-en-vivo.test.ts la ata al esquema con una tabla de
// casos: acepta, rechaza y normaliza (defaults, claves de más) exactamente igual. Si el contrato cambia y esto no, falla.
// Solo `import type` de esquemas.ts: importar un valor de ahí arrastraría Zod al bundle.
import type { EstadoRuta, Incidente, Programado } from '@/lib/datos/esquemas';

/** Tope de una consulta: pasado esto, se muestra el mensaje con el 140 (nunca «Sin avisos» ni «Normal»). */
export const TIEMPO_MAXIMO_MS = 8000;
/** Cada cuánto se vuelve a consultar con la pestaña visible. La API cachea 60 s. */
export const REFRESCO_MS = 120_000;

/** Las listas cerradas del contrato. Un test las compara con el JSON Schema exportado. */
export const LISTAS = {
  ruta: ['RN 9', 'RN 19', 'RN 34'],
  severidad: ['info', 'precaucion', 'corte'],
  tipo: ['transito', 'obra', 'incidente', 'clima', 'mantenimiento'],
  sentido: ['ambos', 'ascendente', 'descendente'],
} as const;

// Las mismas expresiones que usa Zod 4 para z.iso.datetime({ offset: true }) (zod/v4/core/regexes.js): fecha real
// (con bisiestos), hora con segundos y fracción opcionales, y zona Z o ±HH:MM.
const FECHA =
  '(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))';
const HORA = '(?:[01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d(?:\\.\\d+)?)?';
const INSTANTE = new RegExp(`^${FECHA}T(?:${HORA}(?:Z|([+-](?:[01]\\d|2[0-3]):[0-5]\\d)))$`);
const DIA = /^\d{4}-\d{2}-\d{2}$/;

type Obj = Record<string, unknown>;
const invalido = (): never => {
  throw new TypeError('estado de la ruta inválido');
};
const objeto = (x: unknown): Obj => (typeof x === 'object' && x !== null && !Array.isArray(x) ? (x as Obj) : invalido());
const texto = (x: unknown, min = 0, max = Infinity): string =>
  typeof x === 'string' && x.length >= min && x.length <= max ? x : invalido();
const numero = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : invalido());
const numeroONulo = (x: unknown): number | null => (x === null ? null : numero(x));
const deLista = (lista: readonly string[]) => (x: unknown): string =>
  typeof x === 'string' && lista.includes(x) ? x : invalido();
const instante = (x: unknown): string => (typeof x === 'string' && INSTANTE.test(x) ? x : invalido());
const lista = <T>(leer: (y: unknown) => T) => (x: unknown): T[] => (Array.isArray(x) ? x.map(leer) : invalido());

/** Copia `clave` a `destino` si vino (como `.optional()` de Zod: ausente queda ausente). */
const opcional = (o: Obj, clave: string, leer: (x: unknown) => unknown, destino: Obj): void => {
  if (o[clave] !== undefined) destino[clave] = leer(o[clave]);
};

function incidente(x: unknown): Incidente {
  const o = objeto(x);
  const r: Obj = {
    ruta: deLista(LISTAS.ruta)(o.ruta),
    km: numeroONulo(o.km),
    descripcion: texto(o.descripcion),
    severidad: deLista(LISTAS.severidad)(o.severidad),
    tipo: o.tipo === undefined ? 'incidente' : deLista(LISTAS.tipo)(o.tipo),
  };
  opcional(o, 'kmHasta', numeroONulo, r);
  opcional(o, 'titulo', (v) => texto(v, 1, 80), r);
  opcional(o, 'sentido', deLista(LISTAS.sentido), r);
  opcional(o, 'desde', instante, r);
  opcional(o, 'hasta', instante, r);
  opcional(o, 'desvio', (v) => texto(v, 1, 200), r);
  return r as Incidente;
}

function programado(x: unknown): Programado {
  const o = objeto(x);
  const r = incidente(o) as Obj;
  r.fecha = typeof o.fecha === 'string' && DIA.test(o.fecha) ? o.fecha : invalido();
  r.desde = instante(o.desde);
  r.hasta = instante(o.hasta);
  return r as Programado;
}

/** El estado normalizado como lo devolvería `esquemaEstadoRuta.parse`, o `null` si no cumple el contrato. */
export function validarEstadoRuta(x: unknown): EstadoRuta | null {
  try {
    const o = objeto(x);
    const r: Obj = {
      disponible: typeof o.disponible === 'boolean' ? o.disponible : invalido(),
      ejemplo: o.ejemplo === undefined ? false : typeof o.ejemplo === 'boolean' ? o.ejemplo : invalido(),
    };
    opcional(o, 'actualizado', instante, r);
    opcional(o, 'incidentes', lista(incidente), r);
    opcional(o, 'programados', lista(programado), r);
    return r as EstadoRuta;
  } catch {
    return null;
  }
}

/** Pide el estado. `null` ante cualquier falla: sin red, estado distinto de 200, JSON roto, forma inválida o más de
 *  `tiempoMaximoMs` (el tope cubre también la lectura del cuerpo). Sin credenciales: el dato es público. */
export async function consultarEstado(
  url: string,
  opciones: { fetch?: typeof fetch; tiempoMaximoMs?: number } = {},
): Promise<EstadoRuta | null> {
  const pedir = opciones.fetch ?? fetch;
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), opciones.tiempoMaximoMs ?? TIEMPO_MAXIMO_MS);
  try {
    const r = await pedir(url, { headers: { Accept: 'application/json' }, credentials: 'omit', signal: control.signal });
    if (r.status !== 200) return null;
    return validarEstadoRuta(await r.json());
  } catch {
    return null;
  } finally {
    clearTimeout(reloj);
  }
}
