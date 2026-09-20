import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Home from '@/components/home/Home.astro';
import Hero from '@/components/home/Hero.astro';
import TarifaDestacada from '@/components/home/TarifaDestacada.astro';
import Faq from '@/components/Faq.astro';
import CuentaRegresiva from '@/components/CuentaRegresiva.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async (C: unknown, props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(C as never, { props });

// La home se renderiza entera para mirar su FORMA: qué secciones trae y cuáles no. Ojo: la colección `novedades`
// (astro:content) está vacía fuera de un build, así que NovedadesRecientes no aparece acá y no se puede afirmar
// nada sobre ella desde este test; su lugar en la home lo verifica `pnpm verificar` sobre dist/.
const renderHome = async () =>
  (await AstroContainer.create()).renderToString(Home, { request: new Request('https://covicen.test/') });

describe('Home', () => {
  // La home acordada el 20/09/2026: portada, accesos, El tramo con el mapa, novedades y cierre de contacto. Nada
  // más. Los cuatro componentes que salieron siguen en el repo (la decisión fue de recorte, no de contenido), así
  // que lo único que impide que vuelvan sin que nadie lo decida es este test.
  it('la home trae las cinco secciones acordadas y ninguna más', async () => {
    const html = await renderHome();
    // Solo El tramo lleva id de los que quedan: portada, accesos y cierre no lo necesitan, y NovedadesRecientes no
    // aparece acá porque astro:content está vacío fuera de un build (su lugar lo verifica `pnpm verificar`).
    expect([...html.matchAll(/<section[^>]*id="([^"]+)"/g)].map((m) => m[1])).toEqual(['tramo']);
    for (const [seccion, marca] of [['la tarifa destacada', 'id="tarifa"'], ['obras', 'id="obras"'],
                                    ['servicios', 'id="servicios"'], ['el consorcio', 'id="consorcio"'],
                                    ['las preguntas frecuentes', 'id="faq"']] as const) {
      expect(html, `volvió ${seccion} a la home`).not.toContain(marca);
    }
    // El mapa interactivo viaja adentro de El tramo (está en la home desde septiembre, no hubo que moverlo).
    expect(html, 'la home perdió el mapa interactivo').toContain('data-estacion=');
    // Y los índices quedan corridos: El tramo es 01.
    expect(html).toContain('>01<');
    expect(html, 'quedó un índice salteado').not.toContain('>03<');
  });

  // Call del 20/09/2026: obras se esconde y el estado de la traza no va a la home (los datos de estado-ruta.json
  // son de ejemplo, y un corte inventado que se lee como real es el error más caro del sitio).
  it('la home no habla de obras ni muestra el estado de la traza de ejemplo', async () => {
    const html = await renderHome();
    expect(html, 'volvió el enlace a obras').not.toContain('href="/obras/"');
    expect(html, 'volvió el estado de la traza con datos de muestra').not.toContain('Datos de ejemplo');
    expect(html).not.toContain('Primero las obras');
    expect(html).not.toContain('id="obras"');
  });
});

describe('Hero', () => {
  it('un h1, la fecha de inicio y los dos CTAs', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    expect(html.match(/<h1/g)?.length).toBe(1);
    expect(html).toContain('5 de octubre de 2026');
    expect(html).toContain('href="/tarifas/"');
    expect(html).toContain('href="/el-tramo/"');
  });
  // Decisión de Juli (15/09/2026): la primera pantalla del sitio dice UNA cosa y la dice quieta. El hero tenía un
  // carrusel que alternaba la portada con las novedades destacadas y se sacó; las destacadas siguen en la home, en
  // NovedadesRecientes. De paso desapareció la razón por la que el hero cambiaba de alto cada 8 segundos, que le
  // descuadraba el recorte a la foto.
  it('el hero no rota: ni diapositivas, ni controles, ni novedades adentro', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    for (const marca of ['data-carrusel', 'data-slide', 'data-portada', 'data-pista', 'data-siguiente', 'data-anterior', 'data-pausa', 'rotacion']) {
      expect(html, `el hero volvió a traer ${marca}`).not.toContain(marca);
    }
    expect(html).not.toContain('/novedades/');
  });
  // El párrafo del hero cae sobre la foto a pantalla completa: en texto-2 (gris) daba 3,1:1 sobre el asfalto de la foto
  // de día en tema claro. Va en color pleno, y quien mide que eso alcance es tests/styles/hero-foto.test.ts, que asume
  // justamente --color-texto: si acá vuelve a texto-2, aquella guarda mediría el color equivocado y no se enteraría.
  it('el párrafo del hero va en color pleno, no en texto-2', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    const parrafo = html.match(/<p class="mt-6 max-w-2xl[^"]*"/)?.[0] ?? '';
    expect(parrafo, 'no encontré el párrafo del hero').toContain('text-texto');
    expect(parrafo).not.toContain('text-texto-2');
  });
  // Con una foto por tema, conmutar es un corte seco (el CSS las alterna con `display`) y el canvas del parallax se
  // remonta: el velo de la disolvencia lo tapa. scripts/tema.ts lo levanta antes de cambiar el tema y lo baja después.
  it('con las dos fotos, el hero trae el velo de la disolvencia de tema', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    expect(html).toContain('data-velo-tema');
    expect(html).toContain('class="velo-tema"');
    expect(html).toMatch(/data-velo-tema[^>]*aria-hidden="true"|aria-hidden="true"[^>]*data-velo-tema/);
    // El velo tapa el hero entero, texto incluido: tiene que quedar fuera del árbol de accesibilidad y sin capturar el puntero.
    expect(readFileSync('src/styles/global.css', 'utf8')).toMatch(/\.velo-tema\s*\{[^}]*pointer-events:\s*none/);
  });
  // Regresión medida en producción (15/09/2026): la foto del tema opuesto nace dentro de un `display: none` y, con
  // carga diferida, el navegador no la baja NUNCA, ni siquiera cuando después se la muestra (quedaba en
  // naturalWidth 0). Donde no corre el canvas del parallax —celular, ventana angosta, menos movimiento— el hero se
  // quedaba sin foto al cambiar de tema. Las dos van `eager`; la que no se ve arranca con prioridad baja.
  it('ninguna de las dos fotos del hero va con carga diferida', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    const fotos = (html.match(/<img[^>]*>/g) ?? []).filter((i) => i.includes('parallax-2d-img'));
    expect(fotos.length, 'esperaba las dos fotos del hero').toBe(2);
    fotos.forEach((img) => expect(img, 'una foto del hero quedó diferida').not.toContain('loading="lazy"'));
    expect(fotos.filter((i) => i.includes('fetchpriority="high"')).length, 'solo la visible lleva prioridad alta').toBe(1);
    expect(fotos.filter((i) => i.includes('fetchpriority="low"')).length, 'la oculta va en prioridad baja').toBe(1);
  });
  // WCAG 2.2.2 (pausar, detener, ocultar): lo único que se mueve solo en el hero es la foto (dolly lento, que ya se
  // frena con "menos movimiento"). Texto quieto = nada que pausar.
  it('el hero no necesita controles de pausa porque no rota nada', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    expect(html).not.toContain('data-pausa');
    expect(html).not.toContain('aria-roledescription');
  });
  // `zona-noche` era el parche de cuando la única foto era la nocturna: en tema claro se mostraba esa misma foto, así
  // que la sección entera volvía al tema oscuro para no perder el 4,5:1 del pliego 61.7. Con la foto de día cargada
  // cada tema usa la suya y el parche sobra; el contraste de las dos lo mide tests/styles/hero-foto.test.ts.
  // (El panel del Consorcio sí la sigue llevando: esa foto no tiene versión de día.)
  it('con una foto por tema, el hero sigue el tema y ya no es zona noche', async () => {
    const html = await render(Hero, { empresa: await fuenteLocalJson.empresa() });
    expect(html).not.toMatch(/<section[^>]*class="[^"]*zona-noche/);
    // Una foto por tema: global.css muestra la que corresponde con `display` según html[data-tema].
    expect(html.match(/parallax[^"]*solo-oscuro/g)?.length, 'falta la foto nocturna').toBe(1);
    expect(html.match(/parallax[^"]*solo-claro/g)?.length, 'falta la foto de día').toBe(1);
  });
});

describe('TarifaDestacada', () => {
  it('muestra la categoría destacada al público, la vigencia y la resolución', async () => {
    // Intl separa "$" del número con un espacio no separable (U+00A0 o U+202F): se normaliza con escapes, no con literales.
    const html = (await render(TarifaDestacada, { tarifario: await fuenteLocalJson.tarifario() })).replace(/[  ]/g, ' ');
    expect(html).toContain('$ 1.500');
    expect(html).toContain('Autos');
    expect(html).toContain('$ 1.239,67');
    expect(html).toContain('26 de febrero de 2026');
    expect(html).toContain('Cuadro vigente');
    expect(html).toContain('248/2026');
    expect(html).not.toContain('Tarifa ofertada');
  });
  // `montoSinIva` es nullable en el contrato y significa "sin valor publicado": va el criterio de la casa (esconder,
  // no a confirmar), no un throw que se lleve puesto el build entero del home.
  it('sin valor publicado: no renderiza la sección en vez de romper el build', async () => {
    const base = await fuenteLocalJson.tarifario();
    const sinPrecio = { ...base, tarifas: [{ ...base.tarifas[0]!, montoSinIva: null, montoConIva: null }, ...base.tarifas.slice(1)] };
    const html = await render(TarifaDestacada, { tarifario: sinPrecio });
    expect(html).not.toContain('id="tarifa"');
    expect(html).not.toContain('Cuadro vigente');
    expect(html).not.toContain('Tarifario completo por categoría');
  });
});

describe('Faq', () => {
  it('usa details/summary nativos', async () => {
    const html = await render(Faq, { preguntas: (await fuenteLocalJson.faq()).slice(0, 2) });
    expect(html.match(/<details/g)?.length).toBe(2);
    expect(html).toContain('<summary');
  });
});

describe('CuentaRegresiva', () => {
  it('renderiza texto estático con la fecha y los data-attributes para el script', async () => {
    const html = await render(CuentaRegresiva, { fecha: '2026-10-05' });
    expect(html).toContain('data-cuenta-regresiva');
    expect(html).toContain('data-fecha="2026-10-05"');
    expect(html).toContain('5 de octubre de 2026');
  });
});
