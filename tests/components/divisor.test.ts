import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Home from '@/components/home/Home.astro';
import Divisor from '@/components/ui/Divisor.astro';

// El separador con el isotipo (pedido de Juli del 05/10/2026: «desapareció, tendríamos que recuperarlo»). Se había
// sacado el 15/09, cuando la cinta de avisos pasó a cerrar el hero y el medallón le caía encima. Volvió debajo de la
// cinta, pero ahí no tenía una línea a la vista y quedaba «el logo suelto» (Juli, 05/10): va sobre la costura que separa
// los accesos rápidos de «El tramo», «el div que está justo debajo de las 4 cards».
const render = async (C: unknown) => (await AstroContainer.create()).renderToString(C as never, { request: new Request('https://covicen.test/') });

describe('el separador con el isotipo', () => {
  it('es decorativo: el lector de pantalla lo saltea, y lleva el isotipo en un solo color', async () => {
    const html = await render(Divisor);
    expect(html.match(/<div[^>]*class="[^"]*\bdivisor\b[^"]*"[^>]*>/)?.[0]).toContain('aria-hidden="true"');
    expect(html).toContain('class="divisor-ornamento"');
    expect(html).toMatch(/<svg[^>]*>[\s\S]*fill="currentColor"/);
    expect(html).not.toContain('linearGradient');
  });
  it('en la home va justo debajo de las cuatro tarjetas, sobre la costura de arriba de «El tramo»', async () => {
    const html = await render(Home);
    const accesos = html.indexOf('aria-label="Accesos rápidos"');
    const finAccesos = html.indexOf('</section>', accesos);
    const divisor = html.search(/class="divisor[\s"]/);
    const tramo = html.search(/<section id="tramo"/);
    expect(accesos).toBeGreaterThan(-1);
    expect(divisor).toBeGreaterThan(finAccesos);
    expect(tramo).toBeGreaterThan(divisor);
    // Entre el cierre de los accesos y «El tramo» no hay nada más que el separador: así su línea cae justo sobre la
    // costura de arriba de «El tramo», que es una sección con tono (lleva costura).
    expect(html.slice(finAccesos, tramo).replace(/<!--[\s\S]*?-->/g, '')).toMatch(/^<\/section>\s*<div[^>]*class="divisor[\s\S]*<\/div>\s*$/);
    expect(html.slice(tramo, html.indexOf('>', tramo))).toContain('seccion-tono');
    // Ya no está debajo de la cinta.
    expect(html.search(/class="divisor[\s"]/)).toBeGreaterThan(html.indexOf('data-marquesina'));
    expect(html.slice(html.indexOf('data-marquesina'), accesos)).not.toMatch(/class="divisor[\s"]/);
  });
  it('queda por encima de la sección siguiente, para que no le tape la mitad de abajo del medallón', () => {
    expect(readFileSync('src/components/ui/Divisor.astro', 'utf8')).toMatch(/\.divisor \{[^}]*z-index: 10/);
  });
  it('quieto: sin animación propia', () => {
    expect(readFileSync('src/components/ui/Divisor.astro', 'utf8')).not.toMatch(/animation|@keyframes/);
  });
});
