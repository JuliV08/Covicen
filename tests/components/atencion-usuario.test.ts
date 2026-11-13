import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Footer from '@/components/Footer.astro';
import ContactoCta from '@/components/home/ContactoCta.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { horaSinCorte } from '@/lib/texto';
import Asistencia from '@/pages/asistencia.astro';
import Contacto from '@/pages/contacto.astro';

// 29/10/2026, pedido de Covicen: «Horario de atención: de Lunes a Viernes de 08 a 18 horas. Correo electrónico:
// atencionalusuario@covicen.com.ar». Va en el pie, en Contacto y en la home, y la tabla de canales dice el mismo horario.
// 13/11/2026: el gerente lo cambia a «lunes a viernes de 6 a 18 horas (excepto feriados)», para el público y el 0800.
const HORARIO = 'Lunes a viernes, de 6 a 18 h, excepto feriados';
// En pantalla, «18 h» con espacio duro: la «h» no queda sola en el renglón de abajo.
const HORARIO_EN_PANTALLA = 'Lunes a viernes, de 6 a 18\u00a0h, excepto feriados';
const CORREO = 'atencionalusuario@covicen.com.ar';
// En pantalla, con un corte sugerido después de la «@».
const CORREO_EN_PANTALLA = /atencionalusuario@<wbr\s*\/?>covicen\.com\.ar/;
const contenedor = () => AstroContainer.create();
const pie = async (contacto: unknown) => (await contenedor()).renderToString(Footer, { props: { empresa: await fuenteLocalJson.empresa(), contacto } });
const cta = async (contacto: unknown) => (await contenedor()).renderToString(ContactoCta, { props: { contacto } });

describe('Atención al usuario: horario y correo', () => {
  it('el dato: el correo es el del canal, y el 0800 y el correo dicen el mismo horario', async () => {
    const c = await fuenteLocalJson.contacto();
    expect(c.atencionUsuario).toBe(CORREO);
    expect(c.horarioAtencion).toBe(HORARIO);
    const canal = (id: string) => c.canales.find((k) => k.id === id);
    expect(canal('correo')?.valor).toBe(CORREO);
    expect(canal('linea-0800')?.disponibilidad).toBe(HORARIO);
    expect(canal('correo')?.disponibilidad).toContain('de lunes a viernes, de 6 a 18 h, excepto feriados');
  });

  it('horaSinCorte une solo la unidad: el resto del horario se puede partir', () => {
    expect(horaSinCorte(HORARIO)).toBe(HORARIO_EN_PANTALLA);
    expect(horaSinCorte('24 horas, los 365 días del año')).toBe('24 horas, los 365 días del año');
  });

  it('el pie los muestra en la columna Contacto, con los rótulos de Covicen', async () => {
    const html = await pie(await fuenteLocalJson.contacto());
    expect(html).toMatch(new RegExp(`<dt[^>]*>Horario de atención</dt><dd[^>]*>${HORARIO_EN_PANTALLA}</dd>`));
    expect(html).toMatch(/<dt[^>]*>Correo electrónico<\/dt><dd[^>]*><a href="mailto:atencionalusuario@covicen\.com\.ar"/);
    expect(html).toMatch(CORREO_EN_PANTALLA);
    expect(html.match(/href="mailto:atencionalusuario@covicen\.com\.ar"/g)?.length, 'el correo, una sola vez en el pie').toBe(1);
  });

  it('Contacto: en la tarjeta de atención al usuario, debajo del 0800', async () => {
    const html = await (await contenedor()).renderToString(Contacto, { request: new Request('https://covicen.test/contacto/') });
    const tarjeta = /<div class="tarjeta p-5">[\s\S]*?<\/dl>/.exec(html)?.[0] ?? '';
    expect(tarjeta).toContain('Atención al usuario</p>');
    expect(tarjeta.indexOf('href="tel:08004447777"')).toBeGreaterThan(-1);
    expect(tarjeta.indexOf('href="tel:08004447777"')).toBeLessThan(tarjeta.indexOf('Horario de atención'));
    expect(tarjeta).toMatch(new RegExp(`Horario de atención</dt><dd[^>]*>${HORARIO_EN_PANTALLA}</dd>`));
    expect(tarjeta).toContain(`href="mailto:${CORREO}"`);
    expect(tarjeta).toMatch(CORREO_EN_PANTALLA);
  });

  it('la home: debajo de los botones de contacto', async () => {
    const html = await cta(await fuenteLocalJson.contacto());
    const lista = /<ul[^>]*aria-label="Atención al usuario"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? '';
    expect(lista).toContain(HORARIO_EN_PANTALLA);
    expect(lista).toContain(`href="mailto:${CORREO}"`);
    expect(lista).toMatch(CORREO_EN_PANTALLA);
    expect(html.indexOf('href="tel:08004447777"')).toBeLessThan(html.indexOf(lista));
  });

  // Criterio de la casa: esconder, no «a confirmar». Sin el dato no queda el rótulo ni una lista vacía.
  it('sin horario ni correo no queda nada: ni los rótulos ni una lista vacía', async () => {
    const c = { ...(await fuenteLocalJson.contacto()), horarioAtencion: null, atencionUsuario: null };
    const htmlPie = await pie(c);
    for (const marca of ['Horario de atención', 'Correo electrónico', 'mailto:']) expect(htmlPie, `quedó ${marca} en el pie`).not.toContain(marca);
    const htmlCta = await cta(c);
    expect(htmlCta).not.toContain('aria-label="Atención al usuario"');
    expect(htmlCta).not.toContain('mailto:');
  });

  // Las casillas se atienden en horario de oficina: un pedido de auxilio no puede quedar en una hasta el día hábil
  // siguiente. Y el aviso ya no promete el envío «con la toma de posesión», que fue el 7/10.
  it('el pedido de asistencia no va por correo: el formulario sigue armando el texto para el 140', async () => {
    const html = await (await contenedor()).renderToString(Asistencia, { request: new Request('https://covicen.test/asistencia/') });
    const formulario = /<form[^>]*id="formulario-asistencia"[^>]*>/.exec(html)?.[0] ?? '';
    expect(formulario).toContain('data-canal="a-confirmar"');
    expect(formulario).not.toContain('@');
    expect(html).toContain('Llamá al 140 y dictá tu ubicación');
    expect(html).toContain('El envío por mensaje todavía no está disponible');
    expect(html).not.toContain('se habilita con la toma de posesión');
  });
});
