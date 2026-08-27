import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Hero from '@/components/home/Hero.astro';
import TarifaDestacada from '@/components/home/TarifaDestacada.astro';
import Faq from '@/components/Faq.astro';
import CuentaRegresiva from '@/components/CuentaRegresiva.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (C: unknown, props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(C as never, { props });

describe('Hero', () => {
  it('tiene un solo h1, la fecha de inicio y CTAs a tarifas y tramo', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('5 de octubre de 2026');
    expect(html).toContain('href="/tarifas/"');
    expect(html).toContain('href="/el-tramo/"');
    expect(html).toContain('class="entrada');
  });
});

describe('TarifaDestacada', () => {
  it('muestra la tarifa con y sin IVA, el origen y la vigencia', async () => {
    // Intl separa "$" del número con un espacio no separable (U+00A0 o U+202F): se normaliza con escapes, no con literales.
    const html = (await render(TarifaDestacada, { tarifario: await fuenteLocalJson.tarifario(), empresa: await fuenteLocalJson.empresa() })).replace(/[  ]/g, ' ');
    expect(html).toContain('$ 1.399');
    expect(html).toContain('$ 1.693');
    expect(html).toContain('Vigencia');
    expect(html).toContain('Tarifa ofertada');
  });
});

describe('Faq', () => {
  it('usa details/summary nativos', async () => {
    const html = await render(Faq, { preguntas: (await fuenteLocalJson.faq()).slice(0, 2) });
    expect(html.match(/<details/g)?.length).toBe(2);
    expect(html).toContain('<summary');
  });
});

describe('CuentaRegresiva', () => {
  it('renderiza texto estático con la fecha y los data-attributes para el script', async () => {
    const html = await render(CuentaRegresiva, { fecha: '2026-10-05' });
    expect(html).toContain('data-cuenta-regresiva');
    expect(html).toContain('data-fecha="2026-10-05"');
    expect(html).toContain('5 de octubre de 2026');
  });
});
