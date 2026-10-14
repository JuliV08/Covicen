import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Privacidad from '@/pages/privacidad.astro';
import Telepase from '@/pages/telepase.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// /telepase/ (14/10/2026): la página a la que lleva el QR del folleto de TelePASE. Cuenta la visita en Google Analytics
// y pasa a la adhesión de Telepeaje Plus. Lo que se prueba: que siempre lleve a la adhesión (con JS, sin JS y con el
// botón), que no la indexe nadie, que Analytics viva SOLO acá y que la política de privacidad lo diga cuando está.

// El ID de Analytics y la indexación cambian por caso. Se leen con un getter porque las páginas los leen al
// renderizar: así no hace falta volver a cargar los módulos (cargar el sitio entero por caso pasaba los 5 s).
const caso = vi.hoisted(() => ({ id: null as string | null, indexable: undefined as boolean | undefined }));
vi.mock('@/lib/analitica', async (original) => {
  const real = await original<typeof import('@/lib/analitica')>();
  return { ...real, get ID_GOOGLE_ANALYTICS() { return caso.id; } };
});
vi.mock('@/lib/config', async (original) => {
  const { config } = await original<typeof import('@/lib/config')>();
  return { config: { ...config, get indexable() { return caso.indexable ?? config.indexable; } } };
});
afterEach(() => { caso.id = null; caso.indexable = undefined; });

const render = async (Pagina: unknown, url: string) =>
  (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
const telepase = () => render(Telepase, '/telepase/');
const privacidad = () => render(Privacidad, '/privacidad/');
const comoRegex = (s: string) => s.replace(/[.?/]/g, '\\$&');

describe('/telepase/, la página del QR del folleto', () => {
  it('lleva a la adhesión de Telepeaje Plus: con el script, sin JS y con el botón', async () => {
    const destino = (await fuenteLocalJson.contacto()).enlaces.adhesionTelepase!;
    expect(destino).toMatch(/^https:\/\/www\.telepeajeplus\.com\//);
    const html = await telepase();
    expect(html).toContain(`data-destino="${destino}"`);
    expect(html).toMatch(new RegExp(`<noscript><meta http-equiv="refresh" content="0;url=${comoRegex(destino)}"`));
    const boton = new RegExp(`<a href="${comoRegex(destino)}"[^>]*class="btn btn-primario[^>]*>`).exec(html)?.[0] ?? '';
    expect(boton, 'falta el botón a la adhesión').not.toBe('');
    // En la misma pestaña: el QR abre el navegador del celular y una pestaña nueva ahí es una pestaña perdida.
    expect(boton).not.toContain('target=');
  });

  it('tiene lo que toda página del sitio: un h1, el 140, el salto al contenido y la última actualización', async () => {
    const html = await telepase();
    expect(html.match(/<h1[\s>]/g)?.length).toBe(1);
    expect(html).toContain('href="tel:140"');
    expect(html).toContain('href="#contenido"');
    expect(html).toContain('Última actualización');
  });

  it('no se indexa nunca, aunque el resto del sitio sí', async () => {
    caso.indexable = true;
    expect(await telepase()).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(await privacidad()).not.toContain('name="robots"');
  });

  it('sin ID de Analytics no carga nada de Google, y la política de privacidad no lo nombra', async () => {
    const html = await telepase();
    expect(html).not.toContain('googletagmanager');
    expect(html).toMatch(/data-analytics(?:="")?[\s>]/);
    expect(await privacidad()).not.toContain('Google Analytics');
  });

  it('con el ID, Google Analytics va en esta página y en ninguna otra, y la privacidad lo explica', async () => {
    caso.id = 'G-TEST12345';
    const html = await telepase();
    expect(html).toContain('src="https://www.googletagmanager.com/gtag/js?id=G-TEST12345"');
    expect(html).toContain('data-analytics="G-TEST12345"');
    const politica = await privacidad();
    expect(politica).not.toContain('googletagmanager');
    expect(politica).toContain('Google Analytics');
    expect(politica).toContain('/telepase');
    expect(politica).toContain('no se usa para publicidad');
    // La dirección va escrita, no enlazada: un clic desde la política contaría como una visita del folleto.
    expect(politica).not.toContain('href="/telepase/"');
  });

  it('un ID con otro formato no se publica: el ID va adentro de la dirección de un <script>', async () => {
    caso.id = 'G-abc"><script>';
    const html = await telepase();
    expect(html).not.toContain('googletagmanager');
    expect(html).not.toContain('G-abc');
  });
});
