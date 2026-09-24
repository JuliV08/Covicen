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

  // Pedido del 24/09/2026: el formulario de TelePASE sale hasta que se defina si va a haber oficina virtual. Lo esconde
  // `publicado.formularioTelepase`. El PETG 61.5 b lo exige desde la toma de posesión: por eso este test fija las dos
  // mitades, que hoy no está y que el formulario de reclamos (el 61.5 a) sigue estando.
  it('sin el interruptor prendido no hay formulario de TelePASE, y el de reclamos sigue', async () => {
    expect(publicado.formularioTelepase, 'se prendió el formulario de TelePASE: revisar este test').toBe(false);
    const html = await render();
    expect(html).not.toContain('id="formulario-telepase"');
    expect(html).not.toContain('id="telepase"');
    expect(html).not.toContain('Consultas sobre tu TelePASE');
    expect(html).not.toContain('Consultas de TelePASE');
    expect(html).toContain('id="reclamos"');
  });

  // La tarjeta «Seguimiento de reclamos · Próximamente» es la misma que el gerente pidió sacar de Servicios.
  it('no promete el seguimiento de reclamos en línea', async () => {
    const html = await render();
    expect(html).not.toContain('Seguimiento de reclamos');
    expect(html).not.toContain('data-capacidad=');
  });
});
