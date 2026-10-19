import { describe, expect, it, vi } from 'vitest';
import { ESPERA_GA_MS, TOPE_MS, redirigir } from '@/lib/redireccion';
import { ID_GOOGLE_ANALYTICS, esIdAnalytics } from '@/lib/analitica';

// /telepase/ es la página del QR impreso en el folleto de TelePASE (14/10/2026). Si esto falla, el folleto lleva a una
// pantalla muerta y no hay forma de corregir lo que ya se repartió: por eso se prueba el camino que importa, que la
// persona llegue SIEMPRE a la adhesión, con Google Analytics, sin él y con Google que no contesta.
const DESTINO = 'https://www.telepeajeplus.com/Adhierase';

const preparar = (idAnalytics: string | null, conGtag = true) => {
  const reemplazar = vi.fn<(url: string) => void>();
  const pendientes: Array<{ fn: () => void; ms: number }> = [];
  const esperar = vi.fn((fn: () => void, ms: number) => { pendientes.push({ fn, ms }); });
  const gtag = vi.fn();
  const ir = redirigir({ destino: DESTINO, idAnalytics, gtag: conGtag ? gtag : undefined, reemplazar, esperar });
  return { reemplazar, esperar, gtag, pendientes, ir };
};

describe('redirigir, la página del QR de TelePASE', () => {
  it('sin ID de Analytics pasa a la adhesión en el acto y no le habla a Google', () => {
    const { reemplazar, gtag, pendientes } = preparar(null);
    expect(reemplazar).toHaveBeenCalledExactlyOnceWith(DESTINO);
    expect(gtag).not.toHaveBeenCalled();
    expect(pendientes).toEqual([]);
  });

  it('con Analytics: cuenta la visita sin publicidad ni señales de Google, y pasa cuando Google confirma', () => {
    const { reemplazar, gtag } = preparar('G-ABC123XYZ');
    expect(gtag).toHaveBeenCalledWith('config', 'G-ABC123XYZ', expect.objectContaining({ send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false }));
    const evento = gtag.mock.calls.find((c) => c[0] === 'event');
    expect(evento?.[1]).toBe('page_view');
    expect(evento?.[2]).toMatchObject({ event_timeout: ESPERA_GA_MS });
    expect(reemplazar).not.toHaveBeenCalled();
    (evento![2] as { event_callback: () => void }).event_callback();
    expect(reemplazar).toHaveBeenCalledExactlyOnceWith(DESTINO);
  });

  it('si Google no contesta (bloqueador, sin señal), pasa igual al tope, y una sola vez', () => {
    const { reemplazar, gtag, pendientes } = preparar('G-ABC123XYZ');
    expect(pendientes.map((p) => p.ms)).toEqual([TOPE_MS]);
    pendientes[0]!.fn();
    expect(reemplazar).toHaveBeenCalledExactlyOnceWith(DESTINO);
    // Si Google contesta tarde, no se vuelve a navegar.
    (gtag.mock.calls.find((c) => c[0] === 'event')![2] as { event_callback: () => void }).event_callback();
    expect(reemplazar).toHaveBeenCalledOnce();
  });

  it('el tope le da a Google su tiempo y deja margen para que la espera total quede debajo de dos segundos', () => {
    expect(ESPERA_GA_MS).toBeLessThan(TOPE_MS);
    // La revisión del 14/10/2026 midió 36 a 85 ms entre que arranca el script y que corre el tope.
    expect(TOPE_MS).toBeLessThanOrEqual(1850);
  });

  it('el botón (y el aviso de que Google no cargó) pasan por el mismo camino: una sola navegación', () => {
    const { reemplazar, ir, gtag, pendientes } = preparar('G-ABC123XYZ');
    ir();
    expect(reemplazar).toHaveBeenCalledExactlyOnceWith(DESTINO);
    ir();
    pendientes[0]!.fn();
    (gtag.mock.calls.find((c) => c[0] === 'event')![2] as { event_callback: () => void }).event_callback();
    expect(reemplazar).toHaveBeenCalledOnce();
  });

  it('con un ID pero sin gtag cargado, pasa en el acto', () => {
    const { reemplazar } = preparar('G-ABC123XYZ', false);
    expect(reemplazar).toHaveBeenCalledExactlyOnceWith(DESTINO);
  });
});

describe('esIdAnalytics', () => {
  it('acepta un ID de medición de GA4 y nada más', () => {
    expect(esIdAnalytics('G-ABC123XYZ')).toBe(true);
    expect(esIdAnalytics(null)).toBe(false);
    expect(esIdAnalytics('')).toBe(false);
    expect(esIdAnalytics('UA-12345-1')).toBe(false);
    expect(esIdAnalytics('G-abc123xyz')).toBe(false);
    expect(esIdAnalytics('G-ABC"><script>')).toBe(false);
  });

  // Un ID mal escrito no se publica y la página deja de contar sin que nadie se entere: el build pasaría igual.
  it('el ID cargado en src/lib/analitica.ts es null o un ID válido', () => {
    expect(ID_GOOGLE_ANALYTICS === null || esIdAnalytics(ID_GOOGLE_ANALYTICS)).toBe(true);
  });
});
