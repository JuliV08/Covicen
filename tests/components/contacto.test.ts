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
  // `publicado.formularioTelepase`. El PETG 61.5 b lo exige desde la toma de posesión, así que prenderlo tiene que ser
  // cambiar un false por un true y nada más: este test sigue al interruptor en vez de fijar un valor. El estado prendido
  // se prueba aparte, en contacto-telepase.test.ts. El formulario de reclamos (el 61.5 a) va siempre.
  it('el formulario de TelePASE está si y solo si el interruptor está prendido, y el de reclamos va siempre', async () => {
    const html = await render();
    for (const marca of ['id="formulario-telepase"', 'id="telepase"', 'Consultas sobre tu TelePASE', 'Consultas de TelePASE']) {
      expect(html.includes(marca), `${marca} con publicado.formularioTelepase en ${publicado.formularioTelepase}`).toBe(publicado.formularioTelepase);
    }
    expect(html).toContain('id="reclamos"');
  });

  // La tarjeta «Seguimiento de reclamos · Próximamente» es la misma que el gerente pidió sacar de Servicios.
  it('no promete el seguimiento de reclamos en línea', async () => {
    const html = await render();
    expect(html).not.toContain('Seguimiento de reclamos');
    expect(html).not.toContain('data-capacidad=');
  });
});
