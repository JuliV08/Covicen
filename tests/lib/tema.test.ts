import { describe, expect, it } from 'vitest';
import { COLOR_TEMA, otroTema, resolverTema, TEMA_POR_DEFECTO } from '@/lib/tema';

describe('resolverTema', () => {
  it('respeta lo guardado si es válido', () => {
    expect(resolverTema('claro', 'oscuro', false)).toBe('claro');
    expect(resolverTema('oscuro', 'claro', true)).toBe('oscuro');
  });
  it('ignora basura guardada y usa el default', () => {
    expect(resolverTema('rosa', 'oscuro', true)).toBe('oscuro');
    expect(resolverTema(null, 'claro', false)).toBe('claro');
  });
  it("'sistema' sigue la preferencia del aparato", () => {
    expect(resolverTema(null, 'sistema', true)).toBe('claro');
    expect(resolverTema(null, 'sistema', false)).toBe('oscuro');
  });
  it('el default actual es oscuro y cada tema tiene su theme-color', () => {
    expect(TEMA_POR_DEFECTO).toBe('oscuro');
    expect(COLOR_TEMA.oscuro).toBe('#0B1526');
    expect(COLOR_TEMA.claro).toBe('#EEF1F4');
    expect(otroTema('oscuro')).toBe('claro');
  });
});
