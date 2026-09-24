import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Canales from '@/components/Canales.astro';
import MediosDePago from '@/pages/medios-de-pago.astro';
import Servicios from '@/pages/servicios.astro';
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

// 24/09/2026. El gerente pidió sacar de Servicios la sección «Más adelante» (oficina virtual y seguimiento de reclamos,
// las dos «Próximamente»). Y como todavía no se sabe si va a haber oficina virtual, Medios de pago deja de prometerla
// «con la toma de posesión»: la sección «Mi cuenta» aparece recién cuando se cargue el enlace.
describe('lo que no existe todavía no se promete', () => {
  const render = async (Pagina: unknown, url: string) =>
    (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
  it('/servicios/ no tiene la sección «Más adelante» ni tarjetas «Próximamente»', async () => {
    const html = await render(Servicios, '/servicios/');
    expect(html).not.toContain('Más adelante');
    expect(html).not.toContain('Lo que se suma cuando existan los sistemas');
    expect(html).not.toContain('Próximamente');
    expect(html).not.toContain('data-capacidad=');
  });
  it('/medios-de-pago/ no muestra «Mi cuenta» sin oficina virtual cargada', async () => {
    expect((await fuenteLocalJson.contacto()).enlaces.oficinaVirtual, 'se cargó la oficina virtual: revisar este test').toBeNull();
    const html = await render(MediosDePago, '/medios-de-pago/');
    expect(html).not.toContain('id="mi-cuenta"');
    expect(html).not.toContain('Se habilita con la toma de posesión');
    expect(html).toContain('id="telepase"');
  });
});
