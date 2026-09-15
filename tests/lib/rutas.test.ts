import { describe, expect, it } from 'vitest';
import { absoluta, esHttp, ruta } from '@/lib/rutas';

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

// Guarda única para las URLs que llegan de afuera (el tarifario y el tramo los va a mandar el backend).
// z.url() acepta javascript: y data: porque son URLs válidas; esto es lo que decide si algo se enlaza.
describe('esHttp', () => {
  it('acepta http y https, con mayúsculas o sin ellas', () => {
    expect(esHttp('https://www.boletinoficial.gob.ar/x')).toBe(true);
    expect(esHttp('http://covicen.com.ar')).toBe(true);
    expect(esHttp('HTTPS://covicen.com.ar')).toBe(true);
  });
  it('rechaza los esquemas que ejecutan código o embeben contenido', () => {
    for (const u of ['javascript:alert(1)', 'data:text/html,hola', 'vbscript:msgbox(1)', 'ftp://a/b', 'file:///c:/x'])
      expect(esHttp(u), u).toBe(false);
  });
  it('rechaza el espacio y los saltos de línea de adelante (el navegador los descarta antes de leer el esquema)', () => {
    expect(esHttp('  javascript:alert(1)')).toBe(false);
    expect(esHttp('java\nscript:alert(1)')).toBe(false);
    expect(esHttp('/tarifas/')).toBe(false);
  });
});
