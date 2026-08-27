import { describe, expect, it } from 'vitest';
import { absoluta, ruta } from '@/lib/rutas';

describe('ruta', () => {
  it('agrega barra final a las páginas', () => expect(ruta('/tarifas')).toBe('/tarifas/'));
  it('respeta la raíz', () => expect(ruta('/')).toBe('/'));
  it('no agrega barra a archivos', () => expect(ruta('/og.png')).toBe('/og.png'));
  it('conserva anclas', () => expect(ruta('/politicas#anticorrupcion')).toBe('/politicas/#anticorrupcion'));
  it('antepone la base', () => {
    expect(ruta('/tarifas', '/covicen/')).toBe('/covicen/tarifas/');
    expect(ruta('/', '/covicen/')).toBe('/covicen/');
  });
});

describe('absoluta', () => {
  it('usa el origen configurado', () => expect(absoluta('/tarifas')).toBe('https://covicen.test/tarifas/'));
});
