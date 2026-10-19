import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Contacto from '@/pages/contacto.astro';
import { publicado } from '@/lib/publicado';

describe('/contacto/', () => {
  const render = async () => (await AstroContainer.create()).renderToString(Contacto, { request: new Request('https://covicen.test/contacto/') });
  // 02/10/2026: sin plazos de respuesta publicados («bajarle el compromiso de los días de respuesta»; Juli eligió
  // sacarlos de todos lados). Ni en los pasos, ni al lado de los formularios, ni en la descripción para Google, y
  // tampoco la prórroga, que sin plazos no tiene a qué referirse. El choque con el PETG 58 y 61.6 está avisado en
  // docs/pendientes-de-confirmacion.md.
  it('no promete plazos de respuesta en ningún lado de la página', async () => {
    const html = await render();
    expect(html).not.toMatch(/d[ií]as h[aá]biles|24 horas te|Acuse en|acuse en/);
    expect(html).not.toContain('Los plazos de respuesta pueden ampliarse');
    expect(html).toContain('Te confirmamos que lo recibimos, con un número para seguirlo.');
    expect(html).not.toContain('una sola vez');
  });

  // PETG 61.5 b: el formulario de consultas de TelePASE. Se escondió el 24/09/2026, volvió el 25/09 y se escondió otra
  // vez el 05/10: «el único que vamos a usar es el del CRM». El choque con el pliego está en los pendientes. Que con el
  // interruptor apagado no quede nada y los fondos sigan alternando lo prueba contacto-telepase.test.ts.
  it('sin el formulario de TelePASE: el único es el del CRM', async () => {
    expect(publicado.formularioTelepase, 'se prendió el formulario de TelePASE: revisar este test').toBe(false);
    const html = await render();
    for (const marca of ['id="formulario-telepase"', 'id="telepase"', 'Consultas sobre tu TelePASE', 'Consultas de TelePASE']) {
      expect(html, `quedó ${marca}`).not.toContain(marca);
    }
    expect(html).toContain('id="reclamos"');
    expect(html).toContain('data-b24-form=');
  });

  // 01/10/2026: el de reclamos (61.5 a) es el formulario del CRM de PREVI (Bitrix24). Desde el 05/10 es el único: el
  // propio de TelePASE se escondió («el único que vamos a usar es el del CRM»).
  it('el formulario de reclamos es el del CRM, y es el único', async () => {
    const html = await render();
    expect(html).toMatch(/<div class="formulario-crm[^"]*"[^>]*id="reclamos"/);
    expect(html).toContain('data-b24-form="inline/1/t2c138"');
    expect(html.match(/data-b24-form=/g)?.length, 'el formulario de Bitrix se monta una sola vez').toBe(1);
    expect(html).not.toMatch(/<form[^>]*id="reclamos"/);
    expect(html).not.toMatch(/<form[^>]*id="formulario-telepase"/);
  });

  // La tarjeta «Seguimiento de reclamos · Próximamente» es la misma que el gerente pidió sacar de Servicios.
  it('no promete el seguimiento de reclamos en línea', async () => {
    const html = await render();
    expect(html).not.toContain('Seguimiento de reclamos');
    expect(html).not.toContain('data-capacidad=');
  });
});
