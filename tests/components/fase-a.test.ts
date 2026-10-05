import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import ContactoCta from '@/components/home/ContactoCta.astro';
import Seccion from '@/components/ui/Seccion.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// Fase A de la tanda estética del 05/10/2026: docs/superpowers/specs/2026-10-05-fase-a-encabezados-design.md.
const render = async (C: unknown, props: Record<string, unknown> = {}) =>
  (await AstroContainer.create()).renderToString(C as never, { props });
const fuentes = (dir: string, ext: RegExp) =>
  readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter((f) => ext.test(f)).map((f) => join(dir, f));

// «Me acaban de pedir también que saque el background grid animado que sigue al mouse» (Juli, 05/10/2026).
describe('fuera la grilla animada', () => {
  it('no quedan ni el componente, ni el script, ni su ayudante de color, ni la clase vieja', () => {
    for (const f of ['src/components/ilustraciones/GrillaCinetica.astro', 'src/scripts/grilla-cinetica.ts', 'src/scripts/lib/color.ts']) {
      expect(existsSync(f), f).toBe(false);
    }
    const rastros = fuentes('src', /\.(astro|ts|css)$/).filter((f) => /data-grilla|GrillaCinetica|grilla-cinetica|seccion-cinetica/.test(readFileSync(f, 'utf8')));
    expect(rastros).toEqual([]);
  });
  it('una sección con tono no trae canvas, y conserva el tono y las dos costuras', async () => {
    const html = await render(Seccion, { titulo: 'Prueba.', fondo: 'fondo-2' });
    expect(html).not.toContain('<canvas');
    expect(html).toMatch(/<section[^>]*class="[^"]*seccion-tono/);
    expect(html.match(/class="costura /g)?.length).toBe(2);
  });
  it('el bloque de Contacto de la home tampoco trae canvas', async () => {
    const html = await render(ContactoCta, { contacto: await fuenteLocalJson.contacto() });
    expect(html).not.toContain('<canvas');
    expect(html).toMatch(/<section[^>]*class="[^"]*seccion-tono/);
  });
});
