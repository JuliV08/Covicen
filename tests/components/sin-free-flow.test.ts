import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { archivosDe } from '../../scripts/lib/html.ts';

// Call del 20/09/2026: «no está asegurado que sea de esa manera y no se sabe cómo va a ser». Leones, San Francisco
// y Totoras se muestran como «Próxima» a secas, sin anunciar modalidad de cobro.
//
// El campo `freeFlow` NO se va: sigue en el contrato (src/lib/datos/esquemas.ts) y en los datos, porque el backend
// lo va a mandar igual y romper el contrato para apagar un texto es cambiar un problema chico por uno caro. Lo que
// se apaga es la UI.
//
// Barrer `src/` entero, y no solo los archivos que hoy lo nombran, es lo que evita la recaída: el día que alguien
// escriba «Free Flow» en una página nueva se entera acá y no en una call con el gerente.
//
// El patrón EXIGE un separador entre las dos palabras, y ahí está justo la línea entre las dos cosas: `freeFlow`
// en camelCase es el nombre del campo del contrato y puede aparecer donde haga falta; «Free Flow» con espacio o
// guion es texto que lee una persona, y eso es lo que se apagó.
const TEXTO_VISIBLE = /free[\s-]+flow/i;
const norm = (p: string) => p.replace(/\\/g, '/');

describe('Free Flow apagado en la cara al público', () => {
  it('ninguna página, componente ni dato de contenido lo nombra', () => {
    const culpables = archivosDe('src')
      .map(norm)
      .filter((a) => /\.(astro|json|md|ts)$/.test(a))
      .filter((a) => TEXTO_VISIBLE.test(readFileSync(a, 'utf8')));
    expect(culpables, `nombran Free Flow: ${culpables.join(', ')}`).toEqual([]);
  });

  it('pero el campo sigue en el contrato con el backend', () => {
    expect(readFileSync('src/lib/datos/esquemas.ts', 'utf8')).toContain('freeFlow');
    const tramo = JSON.parse(readFileSync('src/content/tramo.json', 'utf8')) as { cabinas: Array<{ slug: string; freeFlow?: boolean }> };
    expect(tramo.cabinas.find((c) => c.slug === 'leones')?.freeFlow, 'se borró el dato en vez de apagar la UI').toBe(true);
  });
});
