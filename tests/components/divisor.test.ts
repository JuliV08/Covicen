import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Home from '@/components/home/Home.astro';
import Divisor from '@/components/ui/Divisor.astro';

// El separador con el isotipo entre el hero y lo que sigue (pedido de Juli del 05/10/2026: «desapareció, tendríamos
// que recuperarlo»). Se había sacado el 15/09, cuando la cinta de avisos pasó a cerrar el hero y el medallón le caía
// encima: vuelve debajo de la cinta, con aire.
const render = async (C: unknown) => (await AstroContainer.create()).renderToString(C as never, { request: new Request('https://covicen.test/') });

describe('el separador con el isotipo', () => {
  it('es decorativo: el lector de pantalla lo saltea, y lleva el isotipo en un solo color', async () => {
    const html = await render(Divisor);
    expect(html.match(/<div[^>]*class="[^"]*\bdivisor\b[^"]*"[^>]*>/)?.[0]).toContain('aria-hidden="true"');
    expect(html).toContain('class="divisor-ornamento"');
    expect(html).toMatch(/<svg[^>]*>[\s\S]*fill="currentColor"/);
    expect(html).not.toContain('linearGradient');
  });
  it('en la home va entre el hero (con su cinta) y los accesos rápidos, separado de la cinta', async () => {
    const html = await render(Home);
    const cinta = html.indexOf('data-marquesina');
    const divisor = html.search(/class="divisor\b/);
    const accesos = html.indexOf('aria-label="Accesos rápidos"');
    expect(cinta).toBeGreaterThan(-1);
    expect(divisor).toBeGreaterThan(cinta);
    expect(accesos).toBeGreaterThan(divisor);
    // El separador no tiene alto: su margen empuja también a las tarjetas, así que el aire de abajo es siempre el
    // relleno de Accesos rápidos (py-14 md:py-16) menos medio medallón. Con el mismo margen arriba, el medallón queda
    // justo en el medio: 34 px de cada lado en el celular y 42 en la compu (medido el 05/10/2026).
    const clases = html.match(/<div[^>]*class="divisor[^"]*"/)?.[0] ?? '';
    expect(clases).toMatch(/\bmt-14\b/);
    expect(clases).toMatch(/\bmd:mt-16\b/);
  });
  it('quieto: sin animación propia', () => {
    expect(readFileSync('src/components/ui/Divisor.astro', 'utf8')).not.toMatch(/animation|@keyframes/);
  });
});
