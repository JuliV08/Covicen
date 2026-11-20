import { afterEach, describe, expect, it, vi } from 'vitest';
import { esquemaEstadoRuta } from '@/lib/datos/esquemas';
import { consultarEstado, LISTAS, REFRESCO_MS, TIEMPO_MAXIMO_MS, validarEstadoRuta } from '@/lib/estado-en-vivo';
import { exportarContrato } from '../../scripts/exportar-contrato';

// El navegador no recibe Zod (multiplicaría el JS de la web por un solo control): el control va escrito a mano y esta
// tabla lo ata al contrato. Si el esquema cambia y el control no, falla acá.
const aviso = { ruta: 'RN 9', km: 340, descripcion: 'Corte de pasto en banquina.', severidad: 'precaucion' };
const franja = { desde: '2026-11-30T08:00:00-03:00', hasta: '2026-11-30T12:00:00-03:00' };
const casos: Array<[string, unknown]> = [
  ['completo', {
    disponible: true, ejemplo: false, actualizado: '2026-11-26T10:00:00-03:00',
    incidentes: [{ ...aviso, kmHasta: 352, tipo: 'mantenimiento', titulo: 'Corte de pasto', sentido: 'ambos', desde: '2026-11-26T08:00:00-03:00', hasta: '2026-11-26T17:00:00-03:00', desvio: 'Por colectora.' }],
    programados: [{ ...aviso, ruta: 'RN 34', tipo: 'obra', fecha: '2026-11-30', ...franja }],
  }],
  ['mínimo', { disponible: true }],
  ['no disponible', { disponible: false }],
  ['km nulos, hora sin segundos y en Z', { disponible: true, incidentes: [{ ...aviso, ruta: 'RN 19', km: null, kmHasta: null, tipo: 'clima', desde: '2026-11-26T06:00Z' }] }],
  ['sin tipo y con fracción de segundo', { disponible: true, incidentes: [{ ...aviso, desde: '2026-11-26T06:00:00.123-03:00' }] }],
  ['claves de más', { disponible: true, otra: 1, incidentes: [{ ...aviso, color: 'rojo' }], programados: [{ ...aviso, fecha: '2026-11-30', ...franja, x: 1 }] }],
  ['29 de febrero bisiesto', { disponible: true, actualizado: '2028-02-29T10:00:00-03:00' }],
  ['tipo inválido', { disponible: true, incidentes: [{ ...aviso, tipo: 'pozo' }] }],
  ['severidad inválida', { disponible: true, incidentes: [{ ...aviso, severidad: 'alta' }] }],
  ['km como texto', { disponible: true, incidentes: [{ ...aviso, km: '340' }] }],
  ['km ausente', { disponible: true, incidentes: [{ ruta: 'RN 9', descripcion: 'x', severidad: 'info' }] }],
  ['kmHasta como texto', { disponible: true, incidentes: [{ ...aviso, kmHasta: '352' }] }],
  ['desde sin zona', { disponible: true, incidentes: [{ ...aviso, desde: '2026-11-26T08:00:00' }] }],
  ['zona sin dos puntos', { disponible: true, incidentes: [{ ...aviso, desde: '2026-11-26T08:00:00-0300' }] }],
  ['30 de febrero', { disponible: true, actualizado: '2026-02-30T10:00:00-03:00' }],
  ['programado sin fecha', { disponible: true, programados: [{ ...aviso, ...franja }] }],
  ['programado sin hasta', { disponible: true, programados: [{ ...aviso, fecha: '2026-11-30', desde: franja.desde }] }],
  ['programado con fecha mal escrita', { disponible: true, programados: [{ ...aviso, fecha: '2026-11-3', ...franja }] }],
  ['ruta que no es del tramo', { disponible: true, incidentes: [{ ...aviso, ruta: 'RN 8' }] }],
  ['descripción numérica', { disponible: true, incidentes: [{ ...aviso, descripcion: 5 }] }],
  ['título vacío', { disponible: true, incidentes: [{ ...aviso, titulo: '' }] }],
  ['título de 81', { disponible: true, incidentes: [{ ...aviso, titulo: 'x'.repeat(81) }] }],
  ['desvío de 201', { disponible: true, incidentes: [{ ...aviso, desvio: 'x'.repeat(201) }] }],
  ['desvío de 200', { disponible: true, incidentes: [{ ...aviso, desvio: 'x'.repeat(200) }] }],
  ['sentido inválido', { disponible: true, incidentes: [{ ...aviso, sentido: 'norte' }] }],
  ['incidentes que no son lista', { disponible: true, incidentes: {} }],
  ['ejemplo como texto', { disponible: true, ejemplo: 'no' }],
  ['sin disponible', {}],
  ['null', null],
  ['lista', []],
  ['texto', 'hola'],
];

describe('validarEstadoRuta (atado al contrato)', () => {
  it.each(casos)('%s: acepta lo mismo que esquemaEstadoRuta y devuelve lo mismo', (_, caso) => {
    const zod = esquemaEstadoRuta.safeParse(caso);
    const propio = validarEstadoRuta(caso);
    expect(propio !== null).toBe(zod.success);
    if (zod.success) expect(propio).toEqual(zod.data);
  });

  it('las listas cerradas son las del contrato', () => {
    const e = exportarContrato()['estado-ruta'] as { properties: { incidentes: { items: { properties: Record<string, { enum?: string[] }> } } } };
    const p = e.properties.incidentes.items.properties;
    expect(LISTAS.ruta).toEqual(p.ruta!.enum);
    expect(LISTAS.severidad).toEqual(p.severidad!.enum);
    expect(LISTAS.tipo).toEqual(p.tipo!.enum);
    expect(LISTAS.sentido).toEqual(p.sentido!.enum);
  });
});

describe('consultarEstado', () => {
  afterEach(() => vi.useRealTimers());
  const responde = (cuerpo: string, status = 200): typeof fetch => async () =>
    new Response(cuerpo, { status, headers: { 'Content-Type': 'application/json' } });

  it('los tiempos son los de la spec: 8 s de tope y una consulta cada 2 minutos', () => {
    expect(TIEMPO_MAXIMO_MS).toBe(8000);
    expect(REFRESCO_MS).toBe(120_000);
  });
  it('un 200 válido devuelve el estado', async () => {
    const e = await consultarEstado('https://api.test/api/v1/estado-ruta/', { fetch: responde(JSON.stringify({ disponible: true, incidentes: [aviso] })) });
    expect(e?.incidentes?.[0]?.tipo).toBe('incidente');
  });
  it('pide sin credenciales', async () => {
    const espia = vi.fn<typeof fetch>(async () => new Response('{"disponible":true}'));
    await consultarEstado('https://api.test/x', { fetch: espia });
    expect(espia.mock.calls[0]![1]).toMatchObject({ credentials: 'omit' });
  });
  it('un 500 devuelve null', async () => {
    expect(await consultarEstado('u', { fetch: responde('{"disponible":true}', 500) })).toBeNull();
  });
  it('un JSON roto devuelve null', async () => {
    expect(await consultarEstado('u', { fetch: responde('{"disponible":') })).toBeNull();
  });
  it('una forma inválida devuelve null', async () => {
    expect(await consultarEstado('u', { fetch: responde('{"disponible":"si"}') })).toBeNull();
  });
  it('sin red devuelve null', async () => {
    const sinRed: typeof fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    expect(await consultarEstado('u', { fetch: sinRed })).toBeNull();
  });
  it('a los 8 s sin respuesta devuelve null', async () => {
    vi.useFakeTimers();
    const colgado: typeof fetch = (_u, init) =>
      new Promise((_, rechazar) => init!.signal!.addEventListener('abort', () => rechazar(new DOMException('abort', 'AbortError'))));
    let resultado: unknown = 'pendiente';
    const p = consultarEstado('u', { fetch: colgado }).then((r) => (resultado = r));
    await vi.advanceTimersByTimeAsync(7999);
    expect(resultado).toBe('pendiente');
    await vi.advanceTimersByTimeAsync(1);
    await p;
    expect(resultado).toBeNull();
  });
});
