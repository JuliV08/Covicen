import { describe, expect, it } from 'vitest';
import { estadoPorRuta, FORMA, metaDeAviso, SEVERIDAD } from '@/lib/estado';

const inc = (ruta: 'RN 9' | 'RN 19' | 'RN 34', severidad: 'info' | 'precaucion' | 'corte') => ({ ruta, km: 10, descripcion: 'x', severidad, tipo: 'obra' as const });

describe('estadoPorRuta', () => {
  it('una fila por ruta, con el peor nivel de sus incidentes; sin incidentes dice «Sin avisos»', () => {
    const filas = estadoPorRuta({ disponible: true, ejemplo: false, incidentes: [inc('RN 9', 'info'), inc('RN 9', 'corte'), inc('RN 34', 'precaucion')] }, ['RN 9', 'RN 19', 'RN 34']);
    expect(filas.map((f) => [f.ruta, f.nivel])).toEqual([['RN 9', 'corte'], ['RN 19', 'normal'], ['RN 34', 'precaucion']]);
    expect(filas[0]!.etiqueta).toBe('Corte');
    expect(filas[1]!.etiqueta).toBe('Sin avisos');
    expect(filas[0]!.incidentes).toHaveLength(2);
  });
  it('no disponible: todo normal y sin incidentes', () => {
    expect(estadoPorRuta({ disponible: false, ejemplo: false }, ['RN 9']).map((f) => f.nivel)).toEqual(['normal']);
  });
  it('con la lista vacía, las tres rutas dicen «Sin avisos» (nunca «Normal»: solo mostramos lo que informa Covicen)', () => {
    const filas = estadoPorRuta({ disponible: true, ejemplo: false, incidentes: [] }, ['RN 9', 'RN 19', 'RN 34']);
    expect(filas.map((f) => [f.nivel, f.etiqueta])).toEqual([['normal', 'Sin avisos'], ['normal', 'Sin avisos'], ['normal', 'Sin avisos']]);
  });
});

describe('metaDeAviso', () => {
  const base = { ruta: 'RN 9', km: 340, descripcion: 'x', severidad: 'precaucion', tipo: 'mantenimiento' } as const;
  it('km, sentido y franja en una línea', () => {
    expect(metaDeAviso({ ...base, sentido: 'ambos', desde: '2026-11-26T08:00:00-03:00', hasta: '2026-11-26T17:00:00-03:00' })).toBe('km 340 · ambos sentidos · de 08:00 a 17:00');
  });
  it('un tramo dice «km A a B»', () => {
    expect(metaDeAviso({ ...base, kmHasta: 352.5 })).toBe('km 340 a 352,50');
  });
  it('un imprevisto abierto dice desde qué hora; sin hora no se inventa ninguna', () => {
    expect(metaDeAviso({ ...base, desde: '2026-11-26T06:30:00-03:00' })).toBe('km 340 · desde las 06:30');
    expect(metaDeAviso({ ...base, km: null })).toBe('');
  });
  it('la hora es la de Argentina aunque el proceso corra en otra zona', () => {
    const antes = process.env.TZ;
    process.env.TZ = 'Asia/Tokyo';
    try {
      expect(metaDeAviso({ ...base, desde: '2026-11-26T08:00:00-03:00' })).toContain('08:00');
    } finally {
      process.env.TZ = antes;
    }
  });
  it('cada severidad tiene nombre y forma propia (no se comunica solo por color)', () => {
    expect(SEVERIDAD).toEqual({ corte: 'Corte', precaucion: 'Precaución', info: 'Información' });
    expect(new Set(Object.values(FORMA)).size).toBe(3);
  });
});

