import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Contacto from '@/pages/contacto.astro';
import { publicado } from '@/lib/publicado';

// El PETG 58.1 dice que los plazos "podrán ampliarse por un plazo igual" y no pone tope a la cantidad de prórrogas:
// publicar "una sola vez" le inventa al usuario una restricción que el contrato no tiene. El Anexo B de la spec fija
// además la redacción con la que esa prórroga se publica.
const PRORROGA = 'Los plazos de respuesta pueden ampliarse por un plazo igual cuando haga falta reunir elementos probatorios, con aviso previo al usuario.';

describe('/contacto/', () => {
  const render = async () => (await AstroContainer.create()).renderToString(Contacto, { request: new Request('https://covicen.test/contacto/') });
  it('el paso 3 publica la prórroga del art. 58.1 sin inventarle un límite de veces', async () => {
    const html = await render();
    expect(html).toContain(PRORROGA);
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
    const reclamo = html.split('<section').find((s) => s.includes('Cuatro pasos, con plazos.')) ?? '';
    expect(/^[^>]*class="([^"]*)"/.exec(reclamo)?.[1]).not.toContain('seccion-cinetica');
  });

  // La tarjeta «Seguimiento de reclamos · Próximamente» es la misma que el gerente pidió sacar de Servicios.
  it('no promete el seguimiento de reclamos en línea', async () => {
    const html = await render();
    expect(html).not.toContain('Seguimiento de reclamos');
    expect(html).not.toContain('data-capacidad=');
  });
});
