import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { publicado } from '@/lib/publicado';

// El pedido de la call del 20/09/2026 no fue "no la enlaces": fue que no exista. Una página viva sin enlaces se
// indexa igual, y el día que alguien googlee "obras Covicen" aparece una página que la empresa no quiere publicar.
//
// Astro decide sus rutas por el filesystem y no deja quitarlas desde un hook (el de `astro:routes:resolved` recibe
// una copia del array: ya lo sufrimos con la portada de «Próximamente», ver scripts/lib/solo-portada.ts). Pero una
// ruta REST sí se puede vaciar: `getStaticPaths` devolviendo [] no genera nada, y como el sitemap se arma con las
// rutas generadas, tampoco queda listada. Es nativo y es un false -> true.
describe('obras oculta', () => {
  it('la página es una ruta rest que se apaga con el interruptor, no un archivo suelto', () => {
    expect(existsSync('src/pages/obras.astro'), '/obras volvió a ser una ruta fija: se genera sí o sí').toBe(false);
    expect(existsSync('src/pages/obras/[...resto].astro')).toBe(true);
  });

  // No se importa la página: un .astro trae el layout y astro:content atrás, y fuera de un build el import se
  // cuelga. Acá se fija el CABLEADO —que el interruptor sea el que manda— y el resultado de verdad lo comprueba
  // `pnpm verificar` sobre dist/, que es donde importa: mira el build publicado, no la intención del código.
  it('la ruta se genera solo si el interruptor está prendido', () => {
    const fuente = readFileSync('src/pages/obras/[...resto].astro', 'utf8');
    expect(fuente).toMatch(/export const getStaticPaths = \(\) =>\s*\(publicado\.obras \?/);
    expect(fuente).toContain("import { publicado } from '@/lib/publicado'");
    expect(publicado.obras, 'el interruptor está prendido: hoy /obras no debería publicarse').toBe(false);
  });

  // El contenido NO se borra: es lo que vuelve solo al prender el interruptor. Si alguien lo borra "para limpiar",
  // prender el false deja una página vacía y nadie se entera hasta que la ve un gerente.
  it('el contenido de obras sigue versionado en el repo', () => {
    for (const archivo of [
      'src/content/obras/01-puesta-en-valor.json',
      'src/content/obras/06-cobro-electronico.json',
      'src/content/novedades-despublicadas/2026-08-27-obras-antes-que-peaje.md',
    ]) {
      expect(existsSync(archivo), `se borró ${archivo}, que es lo que vuelve al prender el interruptor`).toBe(true);
    }
  });
});
