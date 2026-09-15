import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { bloqueClaro, bloqueRoot, bloqueTheme, declaracionesDe } from '../../scripts/lib/contraste.ts';

// El hero es el único lugar del sitio donde el texto cae sobre una foto a pantalla completa, así que el contraste no
// depende de un par de tokens (lo que ya miden pares.ts y verificar.ts) sino de la foto, del velo y del tamaño de la
// pantalla a la vez. Esto se nos escapó dos veces: primero con la foto nocturna en tema claro, después con la diurna,
// que en celular daba 2,5:1 sobre el asfalto. Esta guarda mide los píxeles de verdad: lee el velo de global.css y los
// tokens de tokens.css, simula el `object-fit: cover` en varios tamaños y exige lo que pide el pliego 61.7 (WCAG 1.4.3):
// 4,5:1 para el párrafo y 3:1 para el h1, que es texto grande.
// sharp es nativo: se carga con require para que Vite no intente transformarlo. El tipo se declara acá, mínimo y
// explícito, en vez de depender de la forma de sus typings.
type Crudo = { data: Buffer; info: { width: number; height: number; channels: number } };
type Sharp = (archivo: string) => {
  resize: (ancho: number, alto: number, opciones: { fit: 'fill' }) => { raw: () => { toBuffer: (o: { resolveWithObject: true }) => Promise<Crudo> } };
};
const require = createRequire(import.meta.url);
const sharp = require('sharp') as Sharp;

const css = { global: readFileSync('src/styles/global.css', 'utf8'), tokens: readFileSync('src/styles/tokens.css', 'utf8') };
const RATIO_FOTO = 1672 / 941; // las dos fotos del hero comparten encuadre (y el mapa de profundidad del parallax)

const canal = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminancia = ([r, g, b]: number[]) => 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
const contraste = (a: number[], b: number[]) => {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const aRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const sobre = (foto: number[], fondo: number[], alfa: number) => foto.map((c, i) => c * (1 - alfa) + fondo[i]! * alfa);

/** Paradas del degradado del velo, tal como están escritas en global.css: [posición 0-1, opacidad 0-1]. */
const paradas = (regla: string, tokens: Record<string, string>): Array<[number, number]> =>
  [...regla.matchAll(/color-mix\(in srgb, var\(--color-fondo\) (var\(--[\w-]+\)|[\d.]+%), transparent\)\s*([\d.]+)%/g)].map((m) => {
    const crudo = m[1]!.startsWith('var(') ? tokens[m[1]!.slice(6, -1)] ?? '' : m[1]!;
    return [Number(m[2]) / 100, Number(crudo.replace('%', '')) / 100];
  });

/** Bloque `.velo-hero { ... }`: el primero es el de escritorio, el segundo el de la media query de pantalla angosta. */
const reglasVeloHero = (texto: string) =>
  [...texto.matchAll(/\.velo-hero\s*\{([^}]*)\}/g)].map((m) => m[1]!);

const interpolar = (stops: Array<[number, number]>) => (t: number) => {
  for (let i = 0; i < stops.length - 1; i++) {
    const [p0, a0] = stops[i]!;
    const [p1, a1] = stops[i + 1]!;
    if (t <= p1) return a0 + ((t - p0) / (p1 - p0 || 1)) * (a1 - a0);
  }
  return stops.at(-1)![1];
};

const leerFoto = async (archivo: string, brillo: number) => {
  const { data, info } = await sharp(archivo).resize(300, 169, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return (fx: number, fy: number) => {
    const x = Math.round(Math.min(Math.max(fx, 0), 1) * (info.width - 1));
    const y = Math.round(Math.min(Math.max(fy, 0), 1) * (info.height - 1));
    const i = (y * info.width + x) * info.channels;
    return [data[i]! * brillo, data[i + 1]! * brillo, data[i + 2]! * brillo];
  };
};

const oscuro = { ...declaracionesDe(bloqueTheme(css.tokens)), ...declaracionesDe(bloqueRoot(css.tokens)) };
const claro = { ...oscuro, ...declaracionesDe(bloqueClaro(css.tokens)) };
const [reglaAncha, reglaAngosta] = reglasVeloHero(css.global);

// Tamaños reales: del celular más chico que se usa hoy al monitor grande, cruzando el corte de 1024 px por los dos lados.
const PANTALLAS: Array<[string, number, number]> = [
  ['celular chico 360×740', 360, 740], ['celular 390×844', 390, 844], ['celular grande 414×896', 414, 896],
  ['tablet 768×1024', 768, 1024], ['tablet 834×1112', 834, 1112], ['justo antes del corte 1023', 1023, 800],
  ['justo en el corte 1024', 1024, 800], ['notebook 1280×832', 1280, 832], ['escritorio 1440×900', 1440, 900],
  ['monitor 1920×1080', 1920, 1080], ['monitor grande 2560×1440', 2560, 1440],
];
const CORTE = 1024; // px, el mismo 63.9375rem de la media query de global.css
const ALTO_HEADER = 112; // 7rem: el hero mide 100dvh menos eso

describe('contraste del texto del hero sobre la foto (pliego 61.7)', () => {
  it('el velo de global.css se puede leer y trae las paradas esperadas', () => {
    expect(reglaAncha, 'falta la regla .velo-hero de escritorio').toBeTruthy();
    expect(reglaAngosta, 'falta la regla .velo-hero de pantalla angosta').toBeTruthy();
    expect(reglaAncha).toContain('to right');
    expect(reglaAngosta).toContain('to bottom');
    expect(paradas(reglaAncha!, oscuro).length).toBeGreaterThanOrEqual(3);
    expect(paradas(reglaAngosta!, claro).length).toBeGreaterThanOrEqual(3);
    // El velo de abajo sale de un token por tema: la foto nocturna pide poco y la diurna bastante más.
    expect(oscuro['velo-hero-abajo']).toBeTruthy();
    expect(claro['velo-hero-abajo']).toBeTruthy();
    expect(claro['velo-hero-abajo']).not.toBe(oscuro['velo-hero-abajo']);
  });

  const temas = [
    { nombre: 'claro, foto de día', archivo: 'src/assets/atmosfera/hero-ruta-diurna.jpg', tokens: claro },
    { nombre: 'oscuro, foto de noche', archivo: 'src/assets/atmosfera/hero-ruta-nocturna.jpg', tokens: oscuro },
  ];

  for (const tema of temas) {
    it(`tema ${tema.nombre}: el párrafo llega a 4,5:1 y el h1 a 3:1 en toda pantalla`, async () => {
      const brillo = Number(tema.tokens['brillo-foto']);
      const fondo = aRgb(tema.tokens['color-fondo']!);
      const texto = aRgb(tema.tokens['color-texto']!);
      const foto = await leerFoto(tema.archivo, brillo);
      const velo = {
        ancha: interpolar(paradas(reglaAncha!, tema.tokens)),
        angosta: interpolar(paradas(reglaAngosta!, tema.tokens)),
      };
      const flojos: string[] = [];

      for (const [nombre, vw, vh] of PANTALLAS) {
        const alto = vh - ALTO_HEADER;
        // object-fit: cover — la foto se escala para cubrir y se recorta centrada.
        const porAlto = vw / alto < RATIO_FOTO;
        const anchoFoto = porAlto ? alto * RATIO_FOTO : vw;
        const altoFoto = porAlto ? alto : vw / RATIO_FOTO;
        const offX = (anchoFoto - vw) / 2;
        const offY = (altoFoto - alto) / 2;
        const aFoto = (vx: number, vy: number): [number, number] => [(vx * vw + offX) / anchoFoto, (vy * alto + offY) / altoFoto];
        const angosta = vw < CORTE;
        const opacidad = angosta ? velo.angosta : velo.ancha;
        const contenedor = Math.min(vw - 40, 1280); // .contenedor: min(100% - 2.5rem, 80rem)
        const izquierda = (vw - contenedor) / 2;

        // El párrafo es max-w-2xl (42rem) y el h1 max-w-4xl (56rem); el h1 es texto grande, le alcanza 3:1.
        for (const [cual, ancho, minimo] of [['párrafo', 672, 4.5], ['h1', 896, 3]] as const) {
          const derecha = (izquierda + Math.min(ancho, contenedor)) / vw;
          let peor = Infinity;
          for (let vx = izquierda / vw; vx <= derecha; vx += 0.02) {
            for (let vy = 0.3; vy <= 0.78; vy += 0.015) {
              const [fx, fy] = aFoto(vx, vy);
              peor = Math.min(peor, contraste(sobre(foto(fx, fy), fondo, opacidad(angosta ? vy : vx)), texto));
            }
          }
          if (peor < minimo) flojos.push(`${nombre}: ${cual} ${peor.toFixed(2)}:1 (mínimo ${minimo})`);
        }
      }
      expect(flojos, flojos.join('\n')).toEqual([]);
    });
  }
});
