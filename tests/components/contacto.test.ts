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

  // PETG 61.5 b: el formulario de consultas de TelePASE es obligatorio desde la toma de posesión, haya o no oficina
  // virtual. Se escondió el 24/09/2026 «hasta que se defina si va a haber oficina virtual» y volvió el 25/09, cuando se
  // definió (Autogestión). Apagarlo es incumplir el pliego: este test y `verificar.ts` lo frenan. El estado apagado del
  // interruptor se prueba aparte, en contacto-telepase.test.ts. El formulario de reclamos (el 61.5 a) va siempre.
  it('el formulario de TelePASE está (PETG 61.5 b), con su sección, al lado del de reclamos', async () => {
    expect(publicado.formularioTelepase, 'se apagó el formulario de TelePASE: el PETG 61.5 b lo exige').toBe(true);
    const html = await render();
    for (const marca of ['id="formulario-telepase"', 'id="telepase"', 'Consultas sobre tu TelePASE', 'Consultas de TelePASE']) {
      expect(html, `falta ${marca}`).toContain(marca);
    }
    expect(html).toContain('id="reclamos"');
    // Las secciones alternan: TelePASE lleva la grilla y «Cómo hacer un reclamo» vuelve a liso.
    expect(/<section id="telepase"[^>]*class="([^"]*)"/.exec(html)?.[1]).toContain('seccion-cinetica');
    const reclamo = html.split('<section').find((s) => s.includes('Cuatro pasos.')) ?? '';
    expect(/^[^>]*class="([^"]*)"/.exec(reclamo)?.[1]).not.toContain('seccion-cinetica');
  });

  // 01/10/2026: el de reclamos (61.5 a) es el formulario del CRM de PREVI (Bitrix24). El de TelePASE sigue siendo el
  // propio: Bitrix no tiene todavía uno para eso.
  it('el formulario de reclamos es el del CRM, y el de TelePASE sigue siendo el propio', async () => {
    const html = await render();
    expect(html).toMatch(/<div class="formulario-crm[^"]*"[^>]*id="reclamos"/);
    expect(html).toContain('data-b24-form="inline/1/t2c138"');
    expect(html.match(/data-b24-form=/g)?.length, 'el formulario de Bitrix se monta una sola vez').toBe(1);
    expect(html).not.toMatch(/<form[^>]*id="reclamos"/);
    expect(html).toMatch(/<form[^>]*id="formulario-telepase"/);
  });

  // La tarjeta «Seguimiento de reclamos · Próximamente» es la misma que el gerente pidió sacar de Servicios.
  it('no promete el seguimiento de reclamos en línea', async () => {
    const html = await render();
    expect(html).not.toContain('Seguimiento de reclamos');
    expect(html).not.toContain('data-capacidad=');
  });
});
