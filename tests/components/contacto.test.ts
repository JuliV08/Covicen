import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Contacto from '@/pages/contacto.astro';

// El PETG 58.1 dice que los plazos "podrán ampliarse por un plazo igual" y no pone tope a la cantidad de prórrogas:
// publicar "una sola vez" le inventa al usuario una restricción que el contrato no tiene. El Anexo B de la spec fija
// además la redacción con la que esa prórroga se publica.
const PRORROGA = 'Los plazos de respuesta pueden ampliarse por un plazo igual cuando haga falta reunir elementos probatorios, con aviso previo al usuario.';

describe('/contacto/', () => {
  it('el paso 3 publica la prórroga del art. 58.1 sin inventarle un límite de veces', async () => {
    const html = await (await AstroContainer.create()).renderToString(Contacto, { request: new Request('https://covicen.test/contacto/') });
    expect(html).toContain(PRORROGA);
    expect(html).not.toContain('una sola vez');
  });
});
