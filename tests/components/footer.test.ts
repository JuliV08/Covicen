import { readFileSync } from 'node:fs';
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
    // 02/10/2026: «COVICEN S.A.» en lugar de «Sociedad en formación». Sin CUIT ni domicilio, el bloque de datos
    // registrales sigue sin mostrarse (arriba): la razón social sola va en la línea de abajo.
    expect(html).toContain('COVICEN S.A. · ');
    expect(html).not.toContain('Sociedad en formación');
  });
  // Pedido del gerente (01/10/2026): lo que se esconde sale también del pie.
  // Transparencia volvió el 05/10/2026 con la póliza: el pie la enlaza otra vez; Políticas sigue escondida.
  it('no enlaza Políticas mientras esté escondida, y Transparencia sí', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect(html).not.toContain('href="/politicas/"');
    expect(html).toContain('href="/transparencia/"');
    expect(html).toContain('href="/quienes-somos/"');
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
      // Con logo: la máscara con su archivo y su tamaño. El nombre va adentro solo como alternativa para un navegador
      // sin máscara (el CSS lo esconde en los demás; lo prueba el test de estilos de abajo).
      // (En desarrollo y en los tests, la dirección del PNG trae parámetros de Astro al final; en el build sale limpia.)
      expect(adentro, `${nombre} sin logo`).toMatch(/class="logo-institucional"[^>]*style="--logo: url\(&quot;[^"]+?\.(svg|png)(\?[^"]*?)?&quot;\); --alto: [\d.]+rem; --proporcion: [\d.]+"/);
      expect(adentro, `${nombre} sin alternativa en texto`).toMatch(new RegExp(`class="logo-nombre[^"]*"[^>]*>${nombre}</span></span>`));
    }
    expect(fila).toContain('href="tel:140"');
    expect(fila, 'la Red Federal volvió a la fila').not.toContain('red-federal-de-concesiones');
    // La Red Federal sigue enlazada, en el texto del pie.
    expect(html).toMatch(/Concesionaria del Tramo Centro de la <a href="https:\/\/www\.argentina\.gob\.ar\/transporte\/vialidad-nacional\/red-federal-de-concesiones"[^>]*>Red Federal de Concesiones<\/a>/);
  });
  // Data Fiscal pasó a la fila de logos, pero sigue atado al CUIT: sin CUIT no hay QR (lo genera ARCA con ese número).
  // Hoy tampoco existe public/qr-afip.png; el caso con los dos está en footer-data-fiscal.test.ts, que simula el archivo.
  // Desde el 05/10/2026 el CUIT está cargado (sale de la póliza); el QR sigue esperando el archivo de ARCA.
  it('con el CUIT pero sin el archivo del QR, no hay QR de Data Fiscal', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect((await fuenteLocalJson.empresa()).cuit).toBe('30-71959948-2');
    expect(html).not.toContain('qr-afip.png');
  });
  // 05/10/2026: el 0800 en negrita en Contacto, y en la línea de abajo el CUIT y la póliza de responsabilidad civil.
  it('lleva el 0800, el CUIT y la póliza', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect(html).toContain('href="tel:08004447777"');
    expect(html).toContain('0800 444 7777');
    expect(html).toMatch(/CUIT <span class="tabular-nums"[^>]*>30-71959948-2<\/span>/);
    expect(html).toMatch(/href="\/documentos\/poliza-responsabilidad-civil\.pdf" target="_blank"/);
  });
  // Los estilos de la máscara. Van dentro de @supports: sin máscara, un navegador pintaría un rectángulo macizo del
  // color del texto, y ahí tiene que verse el nombre. Y los logos no cambian de color al pasar el mouse: el manual de
  // Vialidad los admite solo en azul, negro o blanco.
  // (El orden de la condición importa en el CSS compilado: eso lo mira verificar.ts sobre dist/, no este test.)
  it('la máscara va dentro de @supports, con el nombre como alternativa, y el hover no cambia el color', () => {
    const fuente = readFileSync('src/components/Footer.astro', 'utf8');
    const estilo = /<style>([\s\S]*)<\/style>/.exec(fuente)?.[1] ?? '';
    const soporte = /@supports \(-webkit-mask-image: none\) or \(mask-image: none\) \{([\s\S]*?)\n  \}/.exec(estilo)?.[1] ?? '';
    expect(soporte, 'la máscara salió del @supports (o se invirtió el orden de la condición)').toMatch(/\.logo-institucional \{[^}]*mask: var\(--logo\)/);
    expect(soporte).toMatch(/\.logo-institucional \{[^}]*background-color: currentColor/);
    expect(soporte, 'con máscara, el nombre de adentro tiene que esconderse').toMatch(/\.logo-nombre \{ display: none; \}/);
    // El hover aclara solo el logo, y solo cuando hay máscara: el nombre en texto de la alternativa, aclarado, perdía contraste.
    expect(soporte).toMatch(/\.institucional:hover \.logo-institucional \{ opacity: [\d.]+; \}/);
    const afuera = estilo.replace(soporte, '');
    expect(afuera, 'hay estilos de máscara fuera del @supports').not.toMatch(/mask:|background-color: currentColor/);
    expect(afuera, 'el hover volvió a aclarar el enlace entero').not.toMatch(/\.institucional:hover|opacity/);
    expect(fuente, 'los logos vuelven a cambiar de color al pasar el mouse').not.toMatch(/class="institucional[^"]*hover:text-/);
  });
});

describe('Footer, columna Empresa (20/09/2026)', () => {
  it('ya no enlaza Obras ni Trabajá con nosotros, y no enlaza Proveedores (escondida el 05/10/2026)', async () => {
    const html = await render(await fuenteLocalJson.empresa(), await fuenteLocalJson.contacto());
    expect(html, 'Obras volvió al pie').not.toContain('href="/obras/"');
    expect(html, 'Trabajá con nosotros volvió al pie').not.toContain('href="/trabaja-con-nosotros/"');
    expect(html).not.toContain('href="/proveedores/"');
  });
});
