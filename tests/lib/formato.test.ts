import { describe, expect, it } from 'vitest';
import { conIva, fechaCorta, fechaHoraLarga, fechaLarga, kmTexto, moneda, numero } from '@/lib/formato';

const sinNbsp = (s: string) => s.replace(/[  ]/g, ' ');

describe('formato es-AR', () => {
  it('moneda sin decimales con punto de miles', () => expect(sinNbsp(moneda(1399))).toBe('$ 1.399'));
  it('moneda con centavos solo cuando los hay', () => expect(sinNbsp(moneda(1692.79))).toBe('$ 1.692,79'));
  it('conIva redondea al peso', () => expect(conIva(1399, 0.21)).toBe(1693));
  it('fechaLarga no corre un día por zona horaria', () => expect(fechaLarga('2026-10-05')).toBe('5 de octubre de 2026'));
  it('fechaCorta', () => expect(fechaCorta('2026-10-05')).toBe('05/10/2026'));
  it('numero con coma decimal', () => expect(numero(679.03, 2)).toBe('679,03'));
  it('kmTexto: coma decimal solo si hay decimales', () => { expect(kmTexto(340)).toBe('340'); expect(kmTexto(19.95)).toBe('19,95'); });
  it('fechaHoraLarga en hora argentina', () => {
    expect(fechaHoraLarga(new Date('2026-09-13T18:04:00Z'))).toBe('13 de septiembre de 2026, 15:04');
  });
});
