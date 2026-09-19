import { describe, expect, it } from 'vitest';
import { avisosVigentes, hoyArgentina } from '@/lib/avisos';
import type { Aviso } from '@/lib/datos/esquemas';

const a = (id: string, extra: Partial<Aviso> = {}): Aviso => ({ id, texto: id, tono: 'info', ...extra });

describe('avisosVigentes', () => {
  it('deja pasar los que no tienen fechas y filtra por desde/hasta inclusive', () => {
    const lista = [a('siempre'), a('futuro', { desde: '2026-10-05' }), a('vencido', { hasta: '2026-09-01' }), a('hoy', { desde: '2026-09-13', hasta: '2026-09-13' })];
    expect(avisosVigentes(lista, '2026-09-13').map((x) => x.id)).toEqual(['siempre', 'hoy']);
    expect(avisosVigentes(lista, '2026-10-05').map((x) => x.id)).toEqual(['siempre', 'futuro']);
  });
  it('hoyArgentina devuelve YYYY-MM-DD', () => {
    expect(hoyArgentina()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
