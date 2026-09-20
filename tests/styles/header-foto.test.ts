import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { bloqueClaro, bloqueRoot, bloqueTheme, declaracionesDe } from '../../scripts/lib/contraste.ts';

// El texto del header cae sobre la foto del hero mientras el fondo de la barra se va opacando con el scroll. El
// gerente lo vio a ojo el 20/09/2026 y la medición le dio la razón: en tema claro el peor momento daba 2,22:1, y NO
// era al final de la animación sino en el medio (scroll ~24 px), con el fondo del header casi transparente y la foto
// ya pasando por detrás de las letras. Subir la opacidad final no lo arregla (2,22 -> 2,29): el arreglo es que cada
// ítem del menú lleve su propia superficie opaca (la pill), así deja de depender de lo que pase por atrás.
// El logotipo y la hamburguesa NO llevan pill y hoy pasan con 4,95:1: entran igual, porque 0,45 de margen es poco y
// este proyecto ya perdió ese margen dos veces al cambiar la foto del hero.
//
// Dos cosas que el modelo NO incluye, y por qué no lo hacen mentir:
// - `backdrop-filter: blur(12px)` del header: un desenfoque promedia píxeles vecinos, no aclara una zona oscura,
//   y además no está garantizado en todos los navegadores.
// - `.velo-hero` y `.hero-luz`, que están entre la foto y el header: el velo empuja el píxel hacia
//   `--color-fondo`, que en los dos temas es del MISMO lado que el texto, así que solo puede mejorar el
//   contraste.
// O sea que esto mide un escenario peor que el real: si pasa acá, pasa en pantalla.
type Crudo = { data: Buffer; info: { width: number; height: number; channels: number } };
type Sharp = (archivo: string) => {
  resize: (ancho: number, alto: number, opciones: { fit: 'fill' }) => { raw: () => { toBuffer: (o: { resolveWithObject: true }) => Promise<Crudo> } };
};
const sharp = createRequire(import.meta.url)('sharp') as Sharp;

const css = { tokens: readFileSync('src/styles/tokens.css', 'utf8'), header: readFileSync('src/components/Header.astro', 'utf8') };
const RATIO_FOTO = 1672 / 941;

const canal = (v: number) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminancia = ([r, g, b]: number[]) => 0.2126 * canal(r!) + 0.7152 * canal(g!) + 0.0722 * canal(b!);
const contraste = (a: number[], b: number[]) => {
  const [x, y] = [luminancia(a), luminancia(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const sobre = (foto: number[], fondo: number[], alfa: number) => foto.map((c, i) => c * (1 - alfa) + fondo[i]! * alfa);

/** `#RRGGBB` o `rgb(r g b / a)` a color y alfa. Un token con alfa NO sirve de pill: la foto se cuela por abajo. */
const aColor = (valor: string): { rgb: number[]; alfa: number } => {
  const m = /rgb\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)/.exec(valor);
  if (m) return { rgb: [Number(m[1]), Number(m[2]), Number(m[3])], alfa: m[4] === undefined ? 1 : Number(m[4]) };
  const h = valor.trim();
  return { rgb: [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), alfa: 1 };
};

/** El token de fondo de la pill del menú, leído de la regla `.nav-item` de Header.astro. `null` = no hay pill. */
const tokenPill = (): string | null => {
  const regla = /\.nav-item\s*\{([\s\S]*?)\}/.exec(css.header)?.[1] ?? '';
  return /background:\s*var\(--color-([\w-]+)\)/.exec(regla)?.[1] ?? null;
};

/** Los px de scroll en los que la animación del fondo del header termina. */
const rangoAnimacion = () => {
  const m = /animation-range:\s*0\s+(\d+)px/.exec(css.header);
  expect(m, 'no encontré `animation-range: 0 Npx` en Header.astro').toBeTruthy();
  return Number(m![1]);
};

const leerFoto = async (archivo: string, brillo: number) => {
  const { data, info } = await sharp(archivo).resize(400, 225, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  return (fx: number, fy: number) => {
    const x = Math.round(Math.min(Math.max(fx, 0), 1) * (info.width - 1));
    const y = Math.round(Math.min(Math.max(fy, 0), 1) * (info.height - 1));
    const i = (y * info.width + x) * info.channels;
    return [data[i]! * brillo, data[i + 1]! * brillo, data[i + 2]! * brillo];
  };
};

const oscuro = { ...declaracionesDe(bloqueTheme(css.tokens)), ...declaracionesDe(bloqueRoot(css.tokens)) };
const claro = { ...oscuro, ...declaracionesDe(bloqueClaro(css.tokens)) };

const PANTALLAS: Array<[string, number, number]> = [
  ['celular chico 360x740', 360, 740], ['celular 390x844', 390, 844], ['celular grande 414x896', 414, 896],
  ['tablet 768x1024', 768, 1024], ['justo en el corte 1024', 1024, 800], ['notebook 1280x832', 1280, 832],
  ['escritorio 1440x900', 1440, 900], ['monitor 1920x1080', 1920, 1080], ['monitor grande 2560x1440', 2560, 1440],
];
const CORTE = 1024;                  // --alto-header baja a 4.5rem abajo de acá (tokens.css)
const ALTO_ANCHO = 112, ALTO_ANGOSTO = 72;
const ALTO_BARRA = 40;               // BarraSuperior: opaca (bg-fondo-2) y solo en escritorio
/** Hasta dónde barrer el scroll. Se DERIVA del rango de la animación en vez de cablearse: `--color-cabecera`
 *  tiene alfa, así que la foto nunca deja de pasar por detrás del header, y con un tope fijo bastaría que
 *  alguien pusiera `animation-range: 0 400px` para que el test dejara de cubrir el tramo malo, en silencio. */
const scrollMax = (rango: number) => rango + ALTO_ANCHO + 48;

describe('contraste del header sobre la foto del hero (pliego 61.7)', () => {
  // Esto mira la REGLA. La otra mitad —que el marcado de cada ítem lleve la clase— se verifica sobre el HTML
  // renderizado en tests/components/layout.test.ts: si alguien sacara `nav-item` de los <a>, la regla seguiría
  // acá y este test quedaría verde con el texto otra vez apoyado en la foto.
  it('la pill del menú existe y su fondo es un token opaco', () => {
    const token = tokenPill();
    expect(token, 'los ítems del menú no declaran fondo: siguen apoyados en la foto').not.toBeNull();
    for (const [tema, tokens] of [['oscuro', oscuro], ['claro', claro]] as const) {
      const valor = tokens[`color-${token}`];
      expect(valor, `el tema ${tema} no define --color-${token}`).toBeDefined();
      expect(aColor(valor!).alfa, `la pill del tema ${tema} tiene alfa: la foto se cuela por abajo`).toBe(1);
    }
  });

  const temas = [
    { nombre: 'claro, foto de día', archivo: 'src/assets/atmosfera/hero-ruta-diurna.jpg', tokens: claro },
    { nombre: 'oscuro, foto de noche', archivo: 'src/assets/atmosfera/hero-ruta-nocturna.jpg', tokens: oscuro },
  ];

  for (const tema of temas) {
    it(`tema ${tema.nombre}: todo el texto del header llega a 4,5:1 en cualquier punto del scroll`, async () => {
      const cabecera = aColor(tema.tokens['color-cabecera']!);
      const token = tokenPill();
      const pill = token ? aColor(tema.tokens[`color-${token}`] ?? '#000000') : null;
      const rango = rangoAnimacion();
      const foto = await leerFoto(tema.archivo, Number(tema.tokens['brillo-foto']));
      // Cada pieza del header con su color de texto y sobre qué se apoya de verdad.
      const piezas = [
        { cual: 'menú', texto: aColor(tema.tokens['color-texto-2']!).rgb, pill },
        { cual: 'logotipo y hamburguesa', texto: aColor(tema.tokens['color-texto']!).rgb, pill: null },
      ];
      const flojos: string[] = [];

      for (const [nombre, vw, vh] of PANTALLAS) {
        const altoHeader = vw >= CORTE ? ALTO_ANCHO : ALTO_ANGOSTO;
        const filaTop = vw >= CORTE ? ALTO_BARRA : 0;           // arriba de esto manda BarraSuperior, que es opaca
        const bandaTop = filaTop + 24, bandaBot = filaTop + 48; // el texto, centrado en su fila de 4,5rem
        const alto = vh - altoHeader;
        const porAlto = vw / alto < RATIO_FOTO;
        const anchoFoto = porAlto ? alto * RATIO_FOTO : vw;
        const altoFoto = porAlto ? alto : vw / RATIO_FOTO;
        const offX = (anchoFoto - vw) / 2, offY = (altoFoto - alto) / 2;

        for (const pieza of piezas) {
          // Con pill opaca el texto se apoya en la pill y el scroll deja de importar: una sola cuenta.
          if (pieza.pill && pieza.pill.alfa === 1) {
            const r = contraste(pieza.pill.rgb, pieza.texto);
            if (r < 4.5) flojos.push(`${nombre}, ${pieza.cual} sobre la pill: ${r.toFixed(2)}:1`);
            continue;
          }
          for (let s = 0; s <= scrollMax(rango); s += 2) {
            const alfa = cabecera.alfa * Math.min(1, s / rango);
            for (let y = bandaTop; y <= bandaBot; y += 2) {
              const heroY = s + y - altoHeader;   // y dentro del hero; negativo = todavía no hay foto detrás
              if (heroY < 0) continue;
              for (let vx = 0.02; vx <= 0.98; vx += 0.02) {
                const px = sobre(foto((vx * vw + offX) / anchoFoto, (heroY + offY) / altoFoto), cabecera.rgb, alfa);
                const r = contraste(px, pieza.texto);
                if (r < 4.5) flojos.push(`${nombre}, scroll ${s}px, ${pieza.cual}: ${r.toFixed(2)}:1`);
              }
            }
          }
        }
      }
      const muestra = flojos.slice(0, 5).join(String.fromCharCode(10));
      expect(flojos.length, `${flojos.length} puntos por debajo de 4,5:1${String.fromCharCode(10)}${muestra}`).toBe(0);
    });
  }
});
