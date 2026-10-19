import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it, vi } from 'vitest';
import Footer from '@/components/Footer.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// El QR de Data Fiscal aparece con dos cosas: el CUIT cargado y el archivo public/qr-afip.png (lo genera ARCA con ese
// CUIT). Hoy no existe ninguna de las dos, así que este archivo simula el archivo con un mock de node:fs (el resto del
// sistema de archivos sigue siendo el real) y le pasa al pie una empresa con CUIT. Desde el 25/09/2026 el QR va en la
// fila de logos institucionales, como en el ejemplo que pasó el equipo, y no en la columna de datos registrales.
vi.mock('node:fs', async (original) => {
  const real = await original<typeof import('node:fs')>();
  return { ...real, existsSync: (ruta: Parameters<typeof real.existsSync>[0]) => ruta === 'public/qr-afip.png' || real.existsSync(ruta) };
});

describe('Footer con CUIT y QR de Data Fiscal', () => {
  it('el QR va en la fila de logos, después de los sitios institucionales y antes del 140', async () => {
    const empresa = { ...(await fuenteLocalJson.empresa()), razonSocial: 'Covicen S.A.', cuit: '30-12345678-9', domicilioLegal: 'Calle 1, Córdoba', enFormacion: false, constanciaUrl: 'https://seti.afip.gob.ar/padron-puc-constancia-internet/ConsultaConstanciaAction.do' };
    const html = await (await AstroContainer.create()).renderToString(Footer, { props: { empresa, contacto: await fuenteLocalJson.contacto() } });
    const fila = /<ul[^>]*aria-label="Sitios institucionales"[\s\S]*?<\/ul>/.exec(html)?.[0] ?? '';
    const qr = fila.indexOf('src="/qr-afip.png"');
    expect(qr, 'el QR no está en la fila de logos').toBeGreaterThan(-1);
    expect(qr, 'el QR quedó antes de los logos').toBeGreaterThan(fila.indexOf('TelePASE'));
    expect(qr, 'el QR quedó después del 140').toBeLessThan(fila.indexOf('href="tel:140"'));
    expect(fila).toMatch(/<img src="\/qr-afip\.png" alt="Código QR de Data Fiscal de ARCA[^"]*"/);
    expect(html.match(/qr-afip\.png/g)?.length, 'el QR aparece dos veces').toBe(1);
    // Los datos registrales siguen en su columna.
    expect(html).toContain('Datos registrales');
    expect(html).toContain('30-12345678-9');
  });
});
