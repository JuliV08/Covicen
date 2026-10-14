import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Privacidad from '@/pages/privacidad.astro';
import Telepase from '@/pages/telepase.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// /telepase/ (14/10/2026): la página a la que lleva el QR del folleto de TelePASE. Cuenta la visita en Google Analytics
// y pasa a la adhesión de Telepeaje Plus. Desde el mismo día, Analytics cuenta además TODA la web (Base.astro), solo en
// el build de producción. Lo que se prueba: que el QR siempre lleve a la adhesión (con JS, sin JS y con el botón), que
// /telepase/ no la indexe nadie, que Analytics se cargue una vez por página y solo en producción, y que la política de
// privacidad diga lo que hace.

// El ID, la indexación y si el build es el de producción cambian por caso. Se leen con un getter porque las páginas los
// leen al renderizar: así no hace falta volver a cargar los módulos (cargar el sitio entero por caso pasaba los 5 s).
const caso = vi.hoisted(() => ({ id: null as string | null, indexable: undefined as boolean | undefined, enProduccion: true }));
vi.mock('@/lib/analitica', async (original) => {
  const real = await original<typeof import('@/lib/analitica')>();
  return { ...real, get ID_GOOGLE_ANALYTICS() { return caso.id; } };
});
vi.mock('@/lib/config', async (original) => {
  const { config } = await original<typeof import('@/lib/config')>();
  return {
    config: {
      ...config,
      get indexable() { return caso.indexable ?? config.indexable; },
      get enProduccion() { return caso.enProduccion; },
    },
  };
});
afterEach(() => { caso.id = null; caso.indexable = undefined; caso.enProduccion = true; });

const render = async (Pagina: unknown, url: string) =>
  (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
const telepase = () => render(Telepase, '/telepase/');
const privacidad = () => render(Privacidad, '/privacidad/');
const comoRegex = (s: string) => s.replace(/[.?/]/g, '\\$&');
const cargasDeGoogle = (html: string) => (html.match(/googletagmanager\.com\/gtag\/js/g) ?? []).length;

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

  it('con el ID, cuenta la visita con su propio script, una sola vez, y pasa en el acto si Google no carga', async () => {
    caso.id = 'G-TEST12345';
    const html = await telepase();
    expect(cargasDeGoogle(html)).toBe(1);
    expect(html).toContain('src="https://www.googletagmanager.com/gtag/js?id=G-TEST12345"');
    expect(html).toContain('data-analytics="G-TEST12345"');
    // El aviso va a `window`: un `dispatchEvent` suelto dentro de `onerror` es el del <script>, y la página no se enteraba.
    expect(html).toMatch(/<script async src="https:\/\/www\.googletagmanager\.com[^"]*" onerror="[^"]*window\.dispatchEvent\(new Event\('ga-fallo'\)\)[^"]*">/);
  });
});

describe('Google Analytics en toda la web', () => {
  it('en producción, cada página lo carga una vez, sin señales de Google ni anuncios', async () => {
    caso.id = 'G-TEST12345';
    const html = await privacidad();
    expect(cargasDeGoogle(html)).toBe(1);
    expect(html).toContain('src="https://www.googletagmanager.com/gtag/js?id=G-TEST12345"');
    expect(html).toMatch(/gtag\('config', ga, \{ allow_google_signals: false, allow_ad_personalization_signals: false \}\)/);
    expect(html).toContain('"G-TEST12345"');
  });

  it('en Pages o en la máquina de uno no carga nada de Google aunque haya ID, y la política no lo nombra', async () => {
    caso.id = 'G-TEST12345';
    caso.enProduccion = false;
    expect(cargasDeGoogle(await telepase())).toBe(0);
    const politica = await privacidad();
    expect(cargasDeGoogle(politica)).toBe(0);
    expect(politica).not.toContain('Google Analytics');
  });

  it('sin ID no carga nada de Google, y la política de privacidad no lo nombra', async () => {
    const html = await telepase();
    expect(html).not.toContain('googletagmanager');
    expect(html).toMatch(/data-analytics(?:="")?[\s>]/);
    const politica = await privacidad();
    expect(politica).not.toContain('googletagmanager');
    expect(politica).not.toContain('Google Analytics');
  });

  it('un ID con otro formato no se publica: el ID va adentro de la dirección de un <script>', async () => {
    caso.id = 'G-abc"><script>';
    for (const html of [await telepase(), await privacidad()]) {
      expect(html).not.toContain('googletagmanager');
      expect(html).not.toContain('G-abc');
    }
  });

  it('la política de privacidad dice lo que hace Google Analytics, y cómo evitarlo', async () => {
    caso.id = 'G-TEST12345';
    const politica = await privacidad();
    expect(politica).toContain('Cuenta las visitas con Google Analytics y, fuera de eso y del formulario de Contacto (abajo), no usa cookies ni herramientas de seguimiento.');
    expect(politica).toMatch(/<h2[^>]*>Estadísticas de visitas<\/h2>/);
    // Lo que GA4 hace de verdad (revisión del 14/10/2026): dos cookies (_ga y _ga_<ID>) de dos años, no «una cookie».
    expect(politica).toContain('dos cookies con un número al azar, que duran dos años');
    expect(politica).toContain('como máximo 14 meses');
    expect(politica).toContain('no se usa para publicidad');
    expect(politica).toContain('el código QR del folleto de TelePASE');
    // Bloquear las cookies no alcanza (gtag manda la visita igual, con otro número), y el complemento es solo para la
    // computadora: la mayoría entra desde el celular (revisión del 14/10/2026).
    expect(politica).toContain('usá un bloqueador de rastreadores o, en la computadora, el');
    expect(politica).toMatch(/<a href="https:\/\/tools\.google\.com\/dlpage\/gaoptout\?hl=es" rel="noopener noreferrer" target="_blank" aria-label="[^"]*se abre en otra pestaña[^"]*">complemento de inhabilitación de Google Analytics<\/a>/);
    // Lo de Bitrix24 («en el resto del sitio no anota nada») no puede leerse como que no hay Analytics.
    expect(politica).toContain('en el resto del sitio no anota nada (las estadísticas de visitas, abajo, son aparte)');
    expect(politica).toContain('Google Analytics es un servicio de Google');
    // Un clic desde la política a la página del QR contaría como una visita del folleto.
    expect(politica).not.toContain('href="/telepase/"');
  });
});
