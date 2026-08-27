import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Formulario from '@/components/Formulario.astro';

const campos = [{ nombre: 'nombre', etiqueta: 'Nombre', requerido: true }, { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea' }];

describe('Formulario', () => {
  it('con WhatsApp: action a wa.me, labels asociados, botón de envío', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Formulario, { props: { asunto: 'Consulta', whatsapp: '5493510000000', email: null, campos } });
    expect(html).toContain('action="https://wa.me/5493510000000?text=Asunto%3A%20Consulta"');
    expect(html).toContain('<label for="campo-nombre"');
    expect(html).toContain('id="campo-nombre"');
    expect(html).toContain('required');
    expect(html).toContain('type="submit"');
  });
  it('sin canales: lo dice y no promete envío', async () => {
    const c = await AstroContainer.create();
    const html = await c.renderToString(Formulario, { props: { asunto: 'Consulta', whatsapp: null, email: null, campos } });
    expect(html).toContain('data-canal="a-confirmar"');
  });
});
