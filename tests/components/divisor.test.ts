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
    const divisor = html.search(/class="divisor[\s"]/);
    const accesos = html.indexOf('aria-label="Accesos rápidos"');
    expect(cinta).toBeGreaterThan(-1);
    expect(divisor).toBeGreaterThan(cinta);
    expect(accesos).toBeGreaterThan(divisor);
    // El separador no tiene alto: su margen empuja también a las tarjetas, así que el aire de abajo es siempre el
    // relleno de Accesos rápidos menos medio medallón. Con el MISMO valor de margen arriba, el medallón queda justo en
    // el medio (34 px de cada lado en el celular y 42 en la compu, medido el 05/10/2026). Se compara contra el relleno
    // real de la sección y no contra números fijos: si alguien cambia uno solo, el medallón se corre y esto falla.
    const margen = html.match(/<div[^>]*class="divisor[\s"][^>]*>/)?.[0] ?? '';
    const relleno = html.match(/<section class="([^"]*)" aria-label="Accesos rápidos"/)?.[1] ?? '';
    const valor = (clases: string, prefijo: string) => new RegExp(`(?:^|\\s|")${prefijo}-(\\d+)(?=[\\s"]|$)`).exec(clases)?.[1];
    expect(valor(relleno, 'py'), 'Accesos rápidos perdió su relleno').toBeDefined();
    expect(valor(margen, 'mt')).toBe(valor(relleno, 'py'));
    expect(valor(margen, 'md:mt')).toBe(valor(relleno, 'md:py'));
  });
  it('quieto: sin animación propia', () => {
    expect(readFileSync('src/components/ui/Divisor.astro', 'utf8')).not.toMatch(/animation|@keyframes/);
  });
});
