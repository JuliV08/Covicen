import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Canales from '@/components/Canales.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

describe('Canales', () => {
  it('lista los canales con plazos; los no habilitados lo dicen sin relleno', async () => {
    const html = await (await AstroContainer.create()).renderToString(Canales, { props: { canales: (await fuenteLocalJson.contacto()).canales } });
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('5 días hábiles');
    expect(html.match(/Se habilita con la toma de posesión/g)?.length).toBe(3);
    expect(html).not.toMatch(/a confirmar/i);
    expect(html).toContain('<caption');
  });
  // Los plazos del art. 58 se publican acá: la prórroga que el mismo artículo habilita tiene que estar al lado de ellos.
  it('publica al pie la prórroga de plazos del art. 58.1, con la redacción literal del pliego', async () => {
    const html = await (await AstroContainer.create()).renderToString(Canales, { props: { canales: (await fuenteLocalJson.contacto()).canales } });
    expect(html).toContain('Los plazos de respuesta pueden ampliarse por un plazo igual cuando haga falta reunir elementos probatorios, con aviso previo al usuario.');
    expect(html).not.toContain('una sola vez');
  });
});
