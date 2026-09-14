import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import InterruptorTema from '@/components/InterruptorTema.astro';
import Base from '@/layouts/Base.astro';
import { COLOR_TEMA, resolverTema, TEMA_POR_DEFECTO } from '@/lib/tema';

const renderBase = async () => {
  const c = await AstroContainer.create();
  return c.renderToString(Base, { request: new Request('https://covicen.test/'), props: { titulo: 'Inicio', descripcion: 'x' }, slots: { default: '<p>x</p>' } });
};

describe('tema', () => {
  it('Base aplica el tema antes de pintar, lo reaplica en cada navegación y el HTML estático trae el default', async () => {
    const html = await renderBase();
    const head = /<head>([\s\S]*?)<\/head>/.exec(html)?.[1] ?? '';
    expect(head).toContain('dataset.tema');
    expect(head).toContain('astro:after-swap');
    expect(head).toContain('prefers-color-scheme: light');
    expect(head).toContain('<meta name="theme-color" content="#0B1526"');
    expect(html).toMatch(/<html lang="es-AR" data-tema="oscuro"/);
  });
  it('el snippet inline resuelve igual que resolverTema: respeta lo guardado y cae al default', async () => {
    const html = await renderBase();
    // El script de define:vars sale como <script> sin atributos; los JSON-LD llevan type y no entran.
    const cuerpo = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]!).find((s) => s.includes('dataset.tema'));
    expect(cuerpo).toBeDefined();
    const correr = (guardado: string | null, prefiereClaro: boolean) => {
      const meta = { content: '', setAttribute(_k: string, v: string) { this.content = v; } };
      const documento = { documentElement: { dataset: {} as Record<string, string> }, querySelector: () => meta, addEventListener: () => {} };
      new Function('document', 'localStorage', 'matchMedia', cuerpo!)(documento, { getItem: () => guardado }, () => ({ matches: prefiereClaro }));
      return { tema: documento.documentElement.dataset.tema, color: meta.content };
    };
    expect(correr('claro', false)).toEqual({ tema: 'claro', color: '#EEF1F4' });
    expect(correr('oscuro', true)).toEqual({ tema: 'oscuro', color: '#0B1526' });
    const porDefecto = resolverTema('basura', TEMA_POR_DEFECTO, true);
    expect(correr('basura', true)).toEqual({ tema: porDefecto, color: COLOR_TEMA[porDefecto] });
    expect(correr(null, false).tema).toBe(resolverTema(null, TEMA_POR_DEFECTO, false));
  });
  it('el interruptor es un botón con estado y nombre, oculto hasta que el script lo monte', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(InterruptorTema, {});
    expect(html).toContain('data-tema-boton');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Cambiar a tema claro"');
    expect(html).toMatch(/<button[^>]*\shidden/);
  });
});

describe('InterruptorTema: el display lo decide el llamador', () => {
  it('no trae inline-flex en su clase base, así el `hidden lg:inline-flex` del header vale en celular', async () => {
    const c = await AstroContainer.create();
    expect(await c.renderToString(InterruptorTema, {})).not.toMatch(/class="[^"]*inline-flex/);
    expect(await c.renderToString(InterruptorTema, { props: { class: 'hidden lg:inline-flex' } })).toContain('hidden lg:inline-flex');
  });
});
