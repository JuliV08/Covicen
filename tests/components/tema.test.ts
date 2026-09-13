import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import InterruptorTema from '@/components/InterruptorTema.astro';
import Base from '@/layouts/Base.astro';

describe('tema', () => {
  it('Base aplica el tema antes de pintar y lo reaplica en cada navegación', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Base, { request: new Request('https://covicen.test/'), props: { titulo: 'Inicio', descripcion: 'x' }, slots: { default: '<p>x</p>' } });
    const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
    expect(head).toContain('dataset.tema');
    expect(head).toContain('astro:after-swap');
    expect(head).toContain('prefers-color-scheme: light');
    expect(head).toContain('<meta name="theme-color" content="#0B1526"');
  });
  it('el interruptor es un botón con estado y nombre', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(InterruptorTema, {});
    expect(html).toContain('data-tema-boton');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Cambiar a tema claro"');
  });
});
