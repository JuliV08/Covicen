import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Boton from '@/components/ui/Boton.astro';
import Card from '@/components/ui/Card.astro';
import Mojon from '@/components/ui/Mojon.astro';
import Seccion from '@/components/ui/Seccion.astro';
import HuecoCapacidad from '@/components/HuecoCapacidad.astro';

const render = async (C: unknown, props: Record<string, unknown>, slot = 'x') =>
  (await AstroContainer.create()).renderToString(C as never, { props, slots: { default: slot } });

describe('Boton', () => {
  it('con href es <a>, sin href es <button type="button">', async () => {
    expect(await render(Boton, { href: '/tarifas' }, 'Ver')).toMatch(/<a [^>]*href="\/tarifas\/"/);
    expect(await render(Boton, {}, 'Ver')).toContain('<button type="button"');
  });
  it('variante vial usa el token vial', async () => {
    expect(await render(Boton, { variante: 'vial', href: 'tel:123' })).toContain('btn-vial');
  });
});

describe('Card', () => {
  it('con href es un link entero con esquineros', async () => {
    const html = await render(Card, { href: '/obras', etiqueta: 'Obra' }, 'cuerpo');
    expect(html).toMatch(/<a [^>]*class="[^"]*esquineros/);
    expect(html).toContain('href="/obras/"');
  });
});

describe('Mojon', () => {
  it('mantiene el número como texto accesible aunque anime', async () => {
    const html = await render(Mojon, { valor: 681, unidad: 'km', etiqueta: 'de rutas', animar: true });
    expect(html).toContain('>681<');
    expect(html).toContain('style="--meta: 681"');
  });
});

describe('Seccion', () => {
  it('renderiza índice, eyebrow y h2 con id', async () => {
    const html = await render(Seccion, { id: 'tarifas', indice: '03', eyebrow: 'Tarifas', titulo: 'Cuánto cuesta' });
    expect(html).toContain('<section id="tarifas"');
    expect(html).toContain('03');
    expect(html).toContain('<h2');
  });
});

describe('HuecoCapacidad', () => {
  it('muestra el hueco con la alternativa real', async () => {
    const html = await render(HuecoCapacidad, {
      capacidad: 'estadoRutasEnVivo', titulo: 'Estado de rutas', descripcion: 'Próximamente', alternativaHref: '/emergencias', alternativaTexto: 'Ver emergencias',
    });
    expect(html).toContain('data-capacidad="estadoRutasEnVivo"');
    expect(html).toContain('href="/emergencias/"');
  });
});
