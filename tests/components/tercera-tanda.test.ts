import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Footer from '@/components/Footer.astro';
import Header from '@/components/Header.astro';
import ContactoCta from '@/components/home/ContactoCta.astro';
import TarjetaEstacion from '@/components/TarjetaEstacion.astro';
import Contacto from '@/pages/contacto.astro';
import Emergencias from '@/pages/emergencias.astro';
import Tramites from '@/pages/tramites.astro';
import Transparencia from '@/pages/transparencia/[...resto].astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { publicado } from '@/lib/publicado';

// Tercera tanda (05/10/2026): el 0800 en todos lados, la póliza de responsabilidad civil, la tarjeta de la grúa de
// Emergencias y el formulario de TelePASE (ese, en contacto.test.ts y contacto-telepase.test.ts).
const contenedor = () => AstroContainer.create();
const pagina = async (Pagina: unknown, url: string) =>
  (await contenedor()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
const NBSP = ' ';
const NUMERO = `0800${NBSP}444${NBSP}7777`;

describe('el 0800 444 7777', () => {
  it('en el header: a la izquierda de la barra de arriba, antes de TelePASE, y primero en el menú del celular', async () => {
    const props = { contacto: await fuenteLocalJson.contacto(), rutaActual: '/' };
    const html = await (await contenedor()).renderToString(Header as never, { props });
    expect(html.match(/class="acceso-destacado acceso-0800/g)?.length, 'barra de arriba y menú').toBe(2);
    const barra = html.split('class="barra-superior')[1]?.split('</div>\n</div>')[0] ?? '';
    expect(barra.indexOf('acceso-0800'), 'falta en la barra de arriba').toBeGreaterThan(-1);
    expect(barra.indexOf('acceso-0800')).toBeLessThan(barra.indexOf('acceso-telepase'));
    // El número va con espacios que no se cortan (html-validate, tel-non-breaking).
    expect(html).toContain(NUMERO);
    expect(html).toContain('href="tel:08004447777"');
  });

  it('en la tarjeta de estación del mapa, al lado del 140', async () => {
    const cabina = (await fuenteLocalJson.tramo()).cabinas.find((c) => c.slug === 'carcarana')!;
    const html = await (await contenedor()).renderToString(TarjetaEstacion, { props: { cabina } });
    expect(html.indexOf('href="tel:140"')).toBeGreaterThan(-1);
    expect(html.indexOf('href="tel:08004447777"')).toBeGreaterThan(html.indexOf('href="tel:140"'));
  });

  // Desde el pie en tarjetas (05/10/2026), el 0800 va en la tarjeta de la marca, la más ancha del mosaico, como una
  // ficha de teléfono junto al 140: el enlace es la ficha entera, con el rótulo arriba y el número abajo, en dos
  // renglones. (Antes, «Atención al usuario 0800 444 7777» en un solo renglón sin cortes medía 277 px en una columna de
  // 216 y metía scroll de costado entre 1024 y 1200 px.)
  it('en el pie, el 0800 es una ficha de teléfono en la tarjeta de la marca', async () => {
    const html = await (await contenedor()).renderToString(Footer, { props: { empresa: await fuenteLocalJson.empresa(), contacto: await fuenteLocalJson.contacto() } });
    const ficha = /<a href="tel:08004447777" class="pie-telefono"[^>]*>([\s\S]*?)<\/a>/.exec(html);
    expect(ficha, 'falta la ficha del 0800 en el pie').not.toBeNull();
    expect(ficha![1]).toMatch(new RegExp(`<span class="eyebrow block"[^>]*>Atención${NBSP}al${NBSP}usuario</span>`));
    expect(ficha![1]).toMatch(new RegExp(`<span class="pie-telefono-numero"[^>]*>${NUMERO}</span>`));
  });

  it('en la home («¿Consultas, reclamos?»), en el respaldo del formulario del CRM y en la Guía de trámites', async () => {
    const cta = await (await contenedor()).renderToString(ContactoCta, { props: { contacto: await fuenteLocalJson.contacto() } });
    expect(cta).toContain('href="tel:08004447777"');
    expect(cta).toContain(`llamanos gratis al ${NUMERO}`);
    const contacto = await pagina(Contacto, '/contacto/');
    const respaldo = /<p class="crm-respaldo[\s\S]*?<\/p>/.exec(contacto)?.[0] ?? '';
    expect(respaldo).toContain('href="tel:08004447777"');
    expect(contacto).toContain(`o la línea gratuita ${NUMERO}`);
    expect(contacto).not.toContain('cuando esté habilitad');
    expect(await pagina(Tramites, '/tramites/')).toContain(`llamanos gratis al ${NUMERO}`);
  });
});

describe('la póliza de responsabilidad civil', () => {
  it('Transparencia es solo la póliza: un h1, los datos, el PDF en otra pestaña y sin la normativa', async () => {
    expect(publicado.transparencia).toBe(true);
    expect(publicado.normativa, 'se prendió la normativa: revisar este test').toBe(false);
    const html = await pagina(Transparencia, '/transparencia/');
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1]).toContain('Póliza de responsabilidad civil.');
    for (const dato of ['Seguros Galicia S.A.', `N.º 000277475`, 'Del 5 de octubre de 2026 al 5 de octubre de 2027']) expect(html).toContain(dato);
    const enlace = /<a href="\/documentos\/poliza-responsabilidad-civil\.pdf"[^>]*>/.exec(html)?.[0] ?? '';
    expect(enlace).toContain('target="_blank"');
    expect(enlace).toContain('rel="noopener noreferrer"');
    // 05/10/2026: los datos en una ficha centrada, como el encabezado (antes quedaban pegados a la izquierda).
    expect(html).toMatch(/<div class="revelar tarjeta mx-auto max-w-4xl[^"]*text-center/);
    expect(html).not.toContain('Normativa aplicable');
    expect(html).not.toContain('PETG');
    expect(/<meta name="description" content="([^"]*)"/.exec(html)?.[1]).not.toContain('Vialidad Nacional');
    // Sin «Transparencia» en el título y sin cortar «responsabilidad» con guion: la letra baja hasta que entra entera.
    expect(html).not.toMatch(/eyebrow[^>]*>\s*Transparencia/i);
    expect(/<title>([^<]*)<\/title>/.exec(html)?.[1]).not.toMatch(/Transparencia/);
    const css = readFileSync('src/pages/transparencia/[...resto].astro', 'utf8');
    expect(css).not.toContain('hyphens: auto');
    expect(css).toMatch(/:global\(#poliza h1\) \{ font-size: min\(clamp\(2\.5rem, 2rem \+ 4vw, 6rem\), 8\.6vw\); overflow-wrap: break-word; \}/);
  });

  it('el PDF está en public/documentos/', () => {
    expect(readFileSync('public/documentos/poliza-responsabilidad-civil.pdf').subarray(0, 5).toString()).toBe('%PDF-');
  });
});

describe('Emergencias sin la tarjeta de la grúa', () => {
  it('no está «gratis y con tiempos comprometidos», y la tabla de canales sí', async () => {
    expect(publicado.gruaEnEmergencias, 'se prendió gruaEnEmergencias: revisar este test').toBe(false);
    const html = await pagina(Emergencias, '/emergencias/');
    expect(html).not.toContain('gratis y con tiempos comprometidos');
    expect(html).toContain('Canales de atención');
    expect(html).toContain('href="tel:08004447777"');
  });
});
