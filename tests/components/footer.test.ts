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
  // 25/09/2026: la fila va con los logos oficiales (pedido del equipo, con el pie de otra concesionaria como ejemplo),
  // en ese orden, y el 140 al final. La Red Federal de Concesiones no tiene logo propio: pasó al texto del pie.
  it('fila institucional: Presidencia, Transporte, Vialidad y TelePASE con su logo, y el 140', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    const fila = /<ul[^>]*aria-label="Sitios institucionales"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? '';
    const esperados = [
      ['Presidencia de la Nación', 'https://www.argentina.gob.ar/'],
      ['Secretaría de Transporte', 'https://www.argentina.gob.ar/transporte'],
      ['Vialidad Nacional', 'https://www.argentina.gob.ar/transporte/vialidad-nacional'],
      ['TelePASE', 'https://www.telepase.com.ar/'],
    ] as const;
    const enlaces = [...fila.matchAll(/<a href="([^"]+)"[^>]*aria-label="([^"]+) \(se abre en otra pestaña\)"[^>]*>([\s\S]*?)<\/a>/g)];
    expect(enlaces.map((m) => [m[2], m[1]])).toEqual(esperados);
    for (const [, , nombre, adentro] of enlaces) {
      // Con logo: la máscara con su archivo y su tamaño, y ningún nombre en texto (ese queda para cuando falte el archivo).
      // (En desarrollo y en los tests, la dirección del PNG trae parámetros de Astro al final; en el build sale limpia.)
      expect(adentro, `${nombre} sin logo`).toMatch(/class="logo-institucional"[^>]*style="--logo: url\(&quot;[^"]+?\.(svg|png)(\?[^"]*?)?&quot;\); --alto: [\d.]+rem; --proporcion: [\d.]+"/);
      expect(adentro, `${nombre} quedó en texto`).not.toContain('eyebrow');
    }
    expect(fila).toContain('href="tel:140"');
    expect(fila, 'la Red Federal volvió a la fila').not.toContain('red-federal-de-concesiones');
    // La Red Federal sigue enlazada, en el texto del pie.
    expect(html).toMatch(/Concesionaria del Tramo Centro de la <a href="https:\/\/www\.argentina\.gob\.ar\/transporte\/vialidad-nacional\/red-federal-de-concesiones"[^>]*>Red Federal de Concesiones<\/a>/);
  });
  // Data Fiscal pasó a la fila de logos, pero sigue atado al CUIT: sin CUIT no hay QR (lo genera ARCA con ese número).
  it('sin CUIT no hay QR de Data Fiscal', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect(html).not.toContain('qr-afip.png');
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
