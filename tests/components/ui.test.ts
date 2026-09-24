import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
  it('con href es un link entero con borde de luz (tarjeta) y variante vial', async () => {
    const html = await render(Card, { href: '/obras', etiqueta: 'Obra' }, 'cuerpo');
    expect(html).toMatch(/<a [^>]*class="[^"]*tarjeta/);
    expect(html).toContain('href="/obras/"');
    expect(await render(Card, { variante: 'vial' }, 'x')).toContain('tarjeta-vial');
  });
});

describe('Mojon', () => {
  it('mantiene el número como texto accesible aunque anime', async () => {
    const html = await render(Mojon, { valor: 681, unidad: 'km', etiqueta: 'de rutas', animar: true });
    expect(html).toContain('>681<');
    expect(html).toContain('data-contador="681"');
  });
});

describe('Seccion', () => {
  it('renderiza eyebrow y h2 con id', async () => {
    const html = await render(Seccion, { id: 'tarifas', eyebrow: 'Tarifas', titulo: 'Cuánto cuesta' });
    expect(html).toContain('<section id="tarifas"');
    expect(html).toContain('Tarifas');
    expect(html).toMatch(/<h2[^>]*>Cuánto cuesta<\/h2>/);
  });
  // Sin eyebrow, el título es lo primero del encabezado: el margen que lo separaba del eyebrow sobra.
  it('con título solo, el h2 no arrastra el margen del eyebrow', async () => {
    const html = await render(Seccion, { id: 'novedades', titulo: 'Novedades.' });
    expect(html).toMatch(/<h2[^>]*>Novedades\.<\/h2>/);
    expect(html).not.toContain('class="eyebrow');
    expect(html.match(/<h2[^>]*>/)?.[0]).not.toContain('mt-3');
  });
  // El cliente marcó dos veces el número de sección («01», «02») y se sacó de todo el sitio el 24/09/2026. Esta
  // guarda impide que vuelva de a una página: el componente ya no lo acepta, y ninguna página puede pasárselo.
  it('ninguna sección del sitio lleva número', () => {
    const conIndice = readdirSync('src', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.astro'))
      .filter((f) => /\bindice[=:]/.test(readFileSync(join('src', f), 'utf8')));
    expect(conIndice, `volvió el número de sección en: ${conIndice.join(', ')}`).toEqual([]);
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
