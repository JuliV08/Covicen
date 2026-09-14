import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Formulario from '@/components/Formulario.astro';

const campos = [{ nombre: 'nombre', etiqueta: 'Nombre', requerido: true }, { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea' }];
const render = async (props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(Formulario, { props: { asunto: 'Consulta', campos, ...props } });

describe('Formulario', () => {
  it('con WhatsApp: action a wa.me, labels asociados, botón de envío y plazos', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, plazos: 'Acuse en 24 hs · Respuesta en 5 días hábiles' });
    expect(html).toContain('action="https://wa.me/5493510000000?text=Asunto%3A%20Consulta"');
    expect(html).toContain('<label for="campo-nombre"');
    expect(html).toContain('id="campo-nombre"');
    expect(html).toContain('type="submit"');
    expect(html).toContain('Acuse en 24 hs');
  });
  it('sin canales: lo dice con la fecha y el 140, y no promete envío', async () => {
    const html = await render({ whatsapp: null, email: null });
    expect(html).toContain('data-canal="a-confirmar"');
    expect(html).toContain('Los formularios se habilitan con la toma de posesión, el 5 de octubre de 2026. Mientras, el');
    expect(html).toMatch(/<a href="tel:140"[^>]*>140<\/a> atiende emergencias las 24 horas\./);
    expect(html).not.toContain('type="submit"');
  });
  it('campo de solo lectura: input readonly con su label (entra al mensaje)', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, campos: [{ nombre: 'ubicacion', etiqueta: 'Ubicación', tipo: 'readonly', valor: '' }] });
    expect(html).toMatch(/<input[^>]*id="campo-ubicacion"[^>]*readonly/);
    expect(html).toContain('<label for="campo-ubicacion"');
  });
});
