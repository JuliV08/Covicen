// Genera los archivos del logo de la web desde los SVG oficiales del manual de marca de septiembre de 2026
// (docs/marca/2026-09/). Se corre a mano cuando cambia la marca; lo que genera queda versionado:
//   src/assets/marca/marca.ts   — los trazos del isotipo y de los dos logotipos horizontales, para los componentes.
//   src/assets/marca/isotipo.svg — el isotipo solo (lo usa generar-og.ts para el ícono de iPhone).
//   public/favicon.svg           — el ícono de la pestaña.
// Uso: node scripts/extraer-marca.mjs
//
// La versión que se usa es la «ruta» del manual (06/10/2026: «quieren este logo»): la ruta rellena con el degradado y
// las marcas del asfalto en BLANCO encima. La «color» las tiene caladas, y sobre un fondo oscuro se veían oscuras. El
// manual trae la «ruta» del isotipo y del logotipo largo, pero no del corto: el corto se arma con sus letras y el isotipo
// del largo «ruta», puesto exactamente donde el corto tiene el suyo (se miden los dos y se calcula la transformación).
// La versión de un solo color (el separador) sigue saliendo del isotipo «color»: ahí las marcas tienen que ser huecos.
//
// Los SVG vienen de Illustrator: cada forma tiene una clase (.st0, .st1…) y la clase dice su relleno. El relleno se
// traduce a un papel: el degradado del isotipo, «marcas» (las de la ruta, blancas), «palabra» (COVICEN), «sa» (SA) o
// «lema» (CORREDOR VIAL CENTRO). La palabra, la SA y el lema los pinta la web según el tema (tokens.css,
// --color-logo-*); el degradado y las marcas son los del manual en los dos temas. El recorte (viewBox) se calcula
// pintando el dibujo y midiendo dónde hay tinta.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGEN = 'docs/marca/2026-09';
const PAPEL_DE_COLOR = { '#27496f': 'palabra', '#4a91b9': 'sa', '#999': 'lema', '#999999': 'lema', '#fff': 'marcas', '#ffffff': 'marcas' };
const esDelIsotipo = (t) => t.degradado !== undefined || t.papel === 'marcas';
const r2 = (n) => Math.round(n * 1000) / 1000;

// Caja con tinta de un dibujo, en las unidades de su viewBox (se pinta en negro a `escala` y se mide).
const medir = (contenido, ancho, alto, escala = 4) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}">${contenido}</svg>`;
  const img = new Resvg(svg, { fitTo: { mode: 'width', value: Math.round(ancho * escala) } }).render();
  // `pixels` es un getter que copia la imagen entera en cada acceso: se lee una vez (adentro del bucle agotaba la memoria).
  const pixeles = img.pixels;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (pixeles[(y * img.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1); }
  }
  const k = img.width / ancho;
  return { x0: x0 / k, y0: y0 / k, x1: x1 / k, y1: y1 / k };
};
const cajaComoViewBox = (c) => `${r2(c.x0 - 1)} ${r2(c.y0 - 1)} ${r2(c.x1 - c.x0 + 2)} ${r2(c.y1 - c.y0 + 2)}`;
const enNegro = (trazos, transform) => {
  const iso = trazos.filter(esDelIsotipo).map((t) => `<path d="${t.d}"/>`).join('');
  const letras = trazos.filter((t) => !esDelIsotipo(t)).map((t) => `<path d="${t.d}"/>`).join('');
  return (transform ? `<g transform="${transform}">${iso}</g>` : iso) + letras;
};

const leer = (archivo) => {
  const svg = readFileSync(`${ORIGEN}/${archivo}`, 'utf8');
  const [, ancho, alto] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg).map(Number);
  const estilos = Object.fromEntries([...svg.matchAll(/\.(st\d+)\s*\{\s*fill:\s*([^;]+);\s*\}/g)].map((m) => [m[1], m[2].trim()]));
  // Degradados: coordenadas propias y paradas (las del que las tiene, si es una referencia con xlink:href).
  const degradados = {};
  for (const m of svg.matchAll(/<linearGradient\b([^>]*?)(\/>|>([\s\S]*?)<\/linearGradient>)/g)) {
    const attr = (n) => (new RegExp(`\\b${n}="([^"]*)"`).exec(m[1]) ?? [])[1];
    const paradas = [...(m[3] ?? '').matchAll(/<stop offset="([^"]*)" stop-color="([^"]*)"/g)].map((s) => [Number(s[1]), s[2].toLowerCase()]);
    degradados[attr('id')] = { x1: attr('x1'), y1: attr('y1'), x2: attr('x2'), y2: attr('y2'), paradas, ref: (attr('xlink:href') ?? '').replace('#', '') };
  }
  for (const g of Object.values(degradados)) if (!g.paradas.length) g.paradas = degradados[g.ref].paradas;
  const usados = [];
  const trazos = [...svg.matchAll(/<path class="(st\d+)" d="([^"]+)"\s*\/>/g)].map((m) => {
    const relleno = estilos[m[1]];
    const url = /url\(#([^)]+)\)/.exec(relleno)?.[1];
    if (url) {
      if (!usados.includes(url)) usados.push(url);
      return { d: m[2], degradado: usados.indexOf(url) };
    }
    const papel = PAPEL_DE_COLOR[relleno.toLowerCase()];
    if (!papel) throw new Error(`${archivo}: no sé qué papel tiene el relleno ${relleno}`);
    return { d: m[2], papel };
  });
  return {
    ancho, alto,
    viewBox: cajaComoViewBox(medir(enNegro(trazos), ancho, alto)),
    degradados: usados.map((id) => { const { x1, y1, x2, y2 } = degradados[id]; return { x1, y1, x2, y2 }; }),
    paradas: degradados[usados[0]].paradas,
    trazos,
  };
};
const publico = ({ viewBox, degradados, paradas, trazos, transformIsotipo }) => ({ viewBox, degradados, paradas, trazos, ...(transformIsotipo ? { transformIsotipo } : {}) });

const isotipo = leer('isotipo-ruta.svg');
const isotipoUnColor = leer('isotipo-color.svg');
const largo = leer('horizontal-largo-ruta.svg');
const cortoColor = leer('horizontal-corto-color.svg');

// El corto «ruta»: el isotipo del largo «ruta», escalado y movido hasta la caja que ocupa el isotipo en el corto «color».
const destino = medir(enNegro(cortoColor.trazos.filter((t) => t.degradado !== undefined)), cortoColor.ancho, cortoColor.alto, 8);
const origen = medir(enNegro(largo.trazos.filter((t) => t.degradado !== undefined)), largo.ancho, largo.alto, 8);
const escala = ((destino.x1 - destino.x0) / (origen.x1 - origen.x0) + (destino.y1 - destino.y0) / (origen.y1 - origen.y0)) / 2;
const transformIsotipo = `translate(${r2(destino.x0 - origen.x0 * escala)} ${r2(destino.y0 - origen.y0 * escala)}) scale(${r2(escala)})`;
const trazosCorto = [...largo.trazos.filter(esDelIsotipo), ...cortoColor.trazos.filter((t) => !esDelIsotipo(t))];
const corto = {
  viewBox: cajaComoViewBox(medir(enNegro(trazosCorto, transformIsotipo), cortoColor.ancho, cortoColor.alto)),
  degradados: largo.degradados, paradas: largo.paradas, trazos: trazosCorto, transformIsotipo,
};

const ts = `// Generado por scripts/extraer-marca.mjs desde docs/marca/2026-09/ (manual de marca de septiembre de 2026). No editar a mano.
// Cada trazo lleva un degradado (índice en \`degradados\`, con las \`paradas\` del manual) o un papel: «marcas» (las de la
// ruta, blancas), «palabra» (COVICEN), «sa» (SA) o «lema» (CORREDOR VIAL CENTRO). La palabra, la SA y el lema los pinta la
// web según el tema con --color-logo-*. \`transformIsotipo\`, si está, ubica el isotipo dentro del dibujo.
export interface Trazo { d: string; degradado?: number; papel?: 'marcas' | 'palabra' | 'sa' | 'lema' }
export interface Dibujo { viewBox: string; degradados: { x1: string; y1: string; x2: string; y2: string }[]; paradas: [number, string][]; trazos: Trazo[]; transformIsotipo?: string }
/** El isotipo, versión «ruta» del manual: la C con la ruta y sus marcas blancas. */
export const ISOTIPO: Dibujo = ${JSON.stringify(publico(isotipo))};
/** El isotipo con las marcas caladas, para la versión de un solo color (en un solo tono, las marcas son huecos). */
export const ISOTIPO_UN_COLOR: Dibujo = ${JSON.stringify(publico(isotipoUnColor))};
/** Logotipo horizontal corto: isotipo «ruta» y «COVICEN SA». */
export const LOGO_CORTO: Dibujo = ${JSON.stringify(publico(corto))};
/** Logotipo horizontal largo, versión «ruta»: isotipo, «COVICEN SA» y «CORREDOR VIAL CENTRO». */
export const LOGO_LARGO: Dibujo = ${JSON.stringify(publico(largo))};
`;
writeFileSync('src/assets/marca/marca.ts', ts);

// El isotipo suelto, con ids propios para sus degradados.
const svgIsotipo = (ids) => {
  const defs = isotipo.degradados.map((g, i) => `<linearGradient id="${ids}${i}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${isotipo.paradas.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`).join('');
  const caminos = isotipo.trazos.map((t) => `<path d="${t.d}" fill="${t.degradado !== undefined ? `url(#${ids}${t.degradado})` : '#FFFFFF'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${isotipo.viewBox}" role="img" aria-label="Covicen"><defs>${defs}</defs>${caminos}</svg>\n`;
};
writeFileSync('src/assets/marca/isotipo.svg', svgIsotipo('iso-'));
writeFileSync('public/favicon.svg', svgIsotipo('g'));
console.log('ok', { isotipo: isotipo.viewBox, corto: corto.viewBox, transformIsotipo, largo: largo.viewBox });
