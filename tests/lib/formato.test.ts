import { describe, expect, it } from 'vitest';
import { conIva, fechaCorta, fechaLarga, moneda, numero } from '@/lib/formato';

const sinNbsp = (s: string) => s.replace(/ /g, ' ');

describe('formato es-AR', () => {
  it('moneda sin decimales con punto de miles', () => expect(sinNbsp(moneda(1399))).toBe('$ 1.399'));
  it('conIva redondea al peso', () => expect(conIva(1399, 0.21)).toBe(1693));
  it('fechaLarga no corre un día por zona horaria', () => expect(fechaLarga('2026-10-05')).toBe('5 de octubre de 2026'));
  it('fechaCorta', () => expect(fechaCorta('2026-10-05')).toBe('05/10/2026'));
  it('numero con coma decimal', () => expect(numero(681.92, 2)).toBe('681,92'));
});
