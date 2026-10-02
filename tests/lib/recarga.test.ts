import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { recargaCompleta } from '@/lib/recarga';

// /contacto/ se carga siempre entera: el formulario de Bitrix24 no se vuelve a montar si se llega navegando con el
// ClientRouter (ver src/lib/recarga.ts). Tiene que reconocer la página con y sin base path, con y sin barra final, y
// no agarrar ninguna otra.
describe('recargaCompleta', () => {
  it('reconoce /contacto/ con el base de Pages y con el del dominio', () => {
    for (const [destino, base] of [
      ['/contacto/', '/'], ['/contacto', '/'],
      ['/Covicen/contacto/', '/Covicen/'], ['/Covicen/contacto', '/Covicen'], ['/Covicen/contacto/', '/Covicen'],
    ]) expect(recargaCompleta(destino, base), `${destino} con base ${base}`).toBe(true);
  });
  it('no agarra otras páginas ni la misma ruta fuera del base', () => {
    for (const [destino, base] of [
      ['/', '/'], ['/tarifas/', '/'], ['/contacto-x/', '/'], ['/novedades/contacto/', '/'],
      ['/Covicen/', '/Covicen/'], ['/contacto/', '/Covicen/'], ['/Covicen/tarifas/', '/Covicen/'],
    ]) expect(recargaCompleta(destino, base), `${destino} con base ${base}`).toBe(false);
  });
  it('el script está en el layout, para que corra desde cualquier página', () => {
    expect(readFileSync('src/layouts/Base.astro', 'utf8')).toContain('<script src="../scripts/recarga.ts"></script>');
  });
});
