import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Footer from '@/components/Footer.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (empresa: unknown, contacto: unknown) => (await AstroContainer.create()).renderToString(Footer, { props: { empresa, contacto } });

describe('Footer', () => {
  it('sin datos registrales ni canales comerciales no muestra relleno: nada de "a confirmar"', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect(html).not.toMatch(/a confirmar/i);
    expect(html).not.toContain('Datos registrales');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('Corredor Vial del Centro');
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('Última actualización');
    expect(html).toContain('Sociedad en formación');
  });
  it('con datos registrales y redes los muestra', async () => {
    const e = { ...(await fuenteLocalJson.empresa()), razonSocial: 'Covicen S.A.', cuit: '30-12345678-9', domicilioLegal: 'Calle 1, Córdoba', domicilioComercial: 'Ruta 9 km 340, Carcarañá', enFormacion: false };
    const c = { ...(await fuenteLocalJson.contacto()), lineaGratuita: '0800 555 0000', atencionUsuario: 'atencionalusuario@covicen.com.ar', redes: { instagram: 'https://instagram.com/covicen' } };
    const html = await render(e, c);
    expect(html).toContain('Datos registrales');
    expect(html).toContain('30-12345678-9');
    expect(html).toContain('Domicilio comercial');
    expect(html).toContain('href="mailto:atencionalusuario@covicen.com.ar"');
    expect(html).toContain('href="tel:08005550000"');
    expect(html).toContain('href="https://instagram.com/covicen"');
    expect(html).not.toContain('Sociedad en formación');
  });
  it('fila institucional: Vialidad, Transporte, Presidencia, Red Federal, TelePASE y 140', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    for (const u of ['https://www.argentina.gob.ar/transporte/vialidad-nacional', 'https://www.argentina.gob.ar/transporte', 'https://www.argentina.gob.ar/', 'https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones', 'https://www.telepase.com.ar/']) {
      expect(html).toContain(`href="${u}"`);
    }
    expect(html).toContain('aria-label="Sitios institucionales"');
  });
});

describe('Footer, columna Empresa (20/09/2026)', () => {
  it('ya no enlaza Obras ni Trabajá con nosotros, y sigue enlazando Proveedores', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect(html, 'Obras volvió al pie').not.toContain('href="/obras/"');
    expect(html, 'Trabajá con nosotros volvió al pie').not.toContain('href="/trabaja-con-nosotros/"');
    expect(html).toContain('href="/proveedores/"');
  });
});
