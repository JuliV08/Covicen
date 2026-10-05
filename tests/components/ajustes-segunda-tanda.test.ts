import { existsSync, readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import Header from '@/components/Header.astro';
import Privacidad from '@/pages/privacidad.astro';
import QuienesSomos from '@/pages/quienes-somos.astro';
import Proveedores from '@/pages/proveedores.astro';
import SeguridadVial from '@/pages/seguridad-vial.astro';
import Tramites from '@/pages/tramites.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { publicado } from '@/lib/publicado';
import { recargaCompleta } from '@/lib/recarga';

// Segunda tanda de la reunión con el gerente del 01/10/2026, aplicada el 02/10.
const render = async (Pagina: unknown, url: string) =>
  (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });

// Transparencia volvió el 05/10/2026 para publicar la póliza de responsabilidad civil; su normativa sigue escondida.
describe('Políticas escondida; Transparencia de vuelta, solo con la póliza', () => {
  // Como /obras/: ruta rest que se vacía con el interruptor. Que no se genere lo controla verificar.ts (11b) sobre el
  // dist; acá se fija el cableado y que el contenido siga versionado para cuando se prenda.
  it('son rutas rest que se apagan con su interruptor, y el contenido sigue en el repo', () => {
    for (const [pagina, clave] of [['politicas', 'politicas'], ['transparencia', 'transparencia']] as const) {
      expect(existsSync(`src/pages/${pagina}.astro`), `/${pagina}/ volvió a ser una ruta fija: se genera sí o sí`).toBe(false);
      const fuente = readFileSync(`src/pages/${pagina}/[...resto].astro`, 'utf8');
      expect(fuente).toContain(`export const getStaticPaths = () => (publicado.${clave} ?`);
    }
    expect(publicado.politicas, 'se prendió politicas: revisar este test').toBe(false);
    expect(publicado.transparencia, 'se apagó transparencia: revisar este test').toBe(true);
    expect(publicado.normativa, 'se prendió normativa: revisar este test').toBe(false);
    expect(readFileSync('src/pages/politicas/[...resto].astro', 'utf8')).toContain('Política anticorrupción');
    expect(readFileSync('src/pages/transparencia/[...resto].astro', 'utf8')).toContain('Póliza de responsabilidad civil');
  });
  // «Datos registrales» se eliminó de Transparencia (punto 5): esos datos van en el pie.
  it('Transparencia ya no tiene la sección de datos registrales', () => {
    expect(readFileSync('src/pages/transparencia/[...resto].astro', 'utf8')).not.toContain('titulo="Datos registrales."');
  });
  it('el menú «Nosotros» no ofrece Políticas, y Transparencia sí', async () => {
    const props = { contacto: await fuenteLocalJson.contacto(), rutaActual: '/' };
    const html = await (await AstroContainer.create()).renderToString(Header as never, { props });
    expect(html).not.toContain('href="/politicas/"');
    expect(html).toContain('href="/transparencia/"');
    expect(html).toContain('href="/proveedores/"');
  });
});

describe('Proveedores por el CRM', () => {
  it('el registro es el formulario de Bitrix24, y la página se carga entera como Contacto', async () => {
    const html = await render(Proveedores, '/proveedores/');
    expect(html).toContain('data-b24-form="inline/1/t2c138"');
    expect(html).not.toMatch(/<form[^>]*data-formulario/);
    expect(html).toContain('Portal de proveedores');
    expect(recargaCompleta('/proveedores/', '/')).toBe(true);
    expect(recargaCompleta('/Covicen/proveedores/', '/Covicen/')).toBe(true);
  });
});

describe('Guía de trámites sin su formulario', () => {
  it('no está «Iniciá tu trámite»: en su lugar, el camino a Contacto', async () => {
    expect(publicado.formularioTramites, 'se prendió el interruptor: este test mide el otro estado').toBe(false);
    const html = await render(Tramites, '/tramites/');
    expect(html).not.toContain('Iniciá tu trámite');
    expect(html).not.toContain('id="formulario-tramites"');
    expect(html).toContain('href="/contacto/"');
    expect(html).toContain('Ir a Contacto');
  });
});

describe('Seguridad vial sin números de velocidad', () => {
  // «No sé si hay máxima 130 en esa ruta»: no se confirmaron. Sin números, en la página y en el dato.
  it('la tarjeta de velocidad dice que respetes las indicadas, sin cifras', async () => {
    const html = await render(SeguridadVial, '/seguridad-vial/');
    expect(html).toContain('Respetá las velocidades indicadas');
    expect(html).not.toMatch(/\b(130|110)\b|km\/h/);
    expect(readFileSync('src/content/consejos.json', 'utf8')).not.toMatch(/km\/h/);
  });
});

// «COVICEN S.A.» en lugar de «Sociedad en formación» (punto 2). La revisión encontró dos efectos: el doble punto
// («COVICEN S.A..», y «Guido Mogetta S.A..» desde la tanda anterior) y una novedad que seguía diciendo «La sociedad
// está en formación».
describe('COVICEN S.A.', () => {
  it('Privacidad nombra la sociedad sin doble punto ni «CUIT null»', async () => {
    const html = await render(Privacidad, '/privacidad/');
    expect(html).toContain('COVICEN S.A., CUIT 30-71959948-2. Los datos registrales');
    expect(html).not.toMatch(/S\.A\.\./);
    expect(html).not.toContain('CUIT null');
    expect(html).not.toContain('postulaciones laborales');
  });
  it('la descripción de Quiénes somos no termina en doble punto', async () => {
    const html = await render(QuienesSomos, '/quienes-somos/');
    const descripcion = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(descripcion).toMatch(/Mogetta S\.A\.$/);
  });
  it('ningún contenido del repo dice que la sociedad está en formación', () => {
    const listar = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? listar(`${dir}/${d.name}`) : [`${dir}/${d.name}`]));
    for (const archivo of listar('src/content').filter((a) => /\.(md|json)$/.test(a) && !a.includes('despublicadas'))) {
      expect(readFileSync(archivo, 'utf8'), archivo).not.toMatch(/en formaci[oó]n/i);
    }
  });
});

