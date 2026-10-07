// Genera los archivos del logo de la web desde los SVG oficiales del manual de marca de septiembre de 2026
// (docs/marca/2026-09/). Se corre a mano cuando cambia la marca; lo que genera queda versionado:
//   src/assets/marca/marca.ts   — los trazos del isotipo y de los dos logotipos horizontales, para los componentes.
//   src/assets/marca/isotipo.svg — el isotipo solo (lo usan generar-og.ts para el ícono de iPhone y la imagen de redes).
//   public/favicon.svg           — el ícono de la pestaña.
// Uso: node scripts/extraer-marca.mjs
//
// Los SVG vienen de Illustrator: cada forma tiene una clase (.st0, .st1…) y la clase dice su relleno. El relleno se
// traduce a un papel: el degradado del isotipo, «palabra» (COVICEN), «sa» (SA) o «lema» (CORREDOR VIAL CENTRO). Los
// colores de la palabra, la SA y el lema los pone la web según el tema (tokens.css, --color-logo-*); el degradado es el
// del manual, igual en los dos temas. El recorte (viewBox) se calcula pintando el dibujo y midiendo dónde hay tinta.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const ORIGEN = 'docs/marca/2026-09';
const PAPEL_DE_COLOR = { '#27496f': 'palabra', '#4a91b9': 'sa', '#999': 'lema', '#999999': 'lema' };

const leer = (archivo) => {
  const svg = readFileSync(`${ORIGEN}/${archivo}`, 'utf8');
  const estilos = Object.fromEntries([...svg.matchAll(/\.(st\d+)\s*\{\s*fill:\s*([^;]+);\s*\}/g)].map((m) => [m[1], m[2].trim()]));
  // Degradados: coordenadas propias y paradas (las del que las tiene, si es una referencia con xlink:href).
  const degradados = {};
  for (const m of svg.matchAll(/<linearGradient\b([^>]*?)(\/>|>([\s\S]*?)<\/linearGradient>)/g)) {
    const a = m[1];
    const attr = (n) => (new RegExp(`\\b${n}="([^"]*)"`).exec(a) ?? [])[1];
    const paradas = [...(m[3] ?? '').matchAll(/<stop offset="([^"]*)" stop-color="([^"]*)"/g)].map((s) => [Number(s[1]), s[2].toLowerCase()]);
    degradados[attr('id')] = { x1: attr('x1'), y1: attr('y1'), x2: attr('x2'), y2: attr('y2'), paradas, ref: (attr('xlink:href') ?? '').replace('#', '') };
  }
  for (const g of Object.values(degradados)) if (!g.paradas.length) g.paradas = degradados[g.ref].paradas;
  const trazos = [...svg.matchAll(/<path class="(st\d+)" d="([^"]+)"\s*\/>/g)].map((m) => {
    const relleno = estilos[m[1]];
    const url = /url\(#([^)]+)\)/.exec(relleno)?.[1];
    if (url) return { d: m[2], degradado: url };
    const papel = PAPEL_DE_COLOR[relleno.toLowerCase()];
    if (!papel) throw new Error(`${archivo}: no sé qué papel tiene el relleno ${relleno}`);
    return { d: m[2], papel };
  });
  // Recorte: se pinta en negro a escala 2 y se mide la caja con tinta, con 1 unidad de aire.
  const ancho = Number(/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)[1]);
  const alto = Number(/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg)[2]);
  const negro = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ancho} ${alto}">${trazos.map((t) => `<path d="${t.d}"/>`).join('')}</svg>`;
  const img = new Resvg(negro, { fitTo: { mode: 'width', value: ancho * 2 } }).render();
  // `pixels` es un getter que copia la imagen entera en cada acceso: se lee una vez (adentro del bucle agotaba la memoria).
  const pixeles = img.pixels;
  let [x0, y0, x1, y1] = [Infinity, Infinity, -1, -1];
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (pixeles[(y * img.width + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  const r = (n) => Math.round(n * 100) / 100;
  const viewBox = `${r(x0 / 2 - 1)} ${r(y0 / 2 - 1)} ${r((x1 - x0) / 2 + 3)} ${r((y1 - y0) / 2 + 3)}`;
  const usados = new Set(trazos.map((t) => t.degradado).filter(Boolean));
  const degradadosUsados = Object.fromEntries([...usados].map((id, i) => [id, { ...degradados[id], nombre: `d${i + 1}` }]));
  return {
    viewBox,
    degradados: Object.values(degradadosUsados).map(({ x1, y1, x2, y2 }) => ({ x1, y1, x2, y2 })),
    paradas: Object.values(degradadosUsados)[0].paradas,
    trazos: trazos.map((t) => (t.degradado ? { d: t.d, degradado: Object.keys(degradadosUsados).indexOf(t.degradado) } : t)),
  };
};

const isotipo = leer('isotipo-color.svg');
const corto = leer('horizontal-corto-color.svg');
const largo = leer('horizontal-largo-color.svg');

const ts = `// Generado por scripts/extraer-marca.mjs desde docs/marca/2026-09/ (manual de marca de septiembre de 2026). No editar a mano.
// Cada trazo lleva un degradado (índice en \`degradados\`, con las \`paradas\` del manual) o un papel: «palabra» (COVICEN),
// «sa» (SA) o «lema» (CORREDOR VIAL CENTRO), que la web pinta según el tema con --color-logo-*.
export interface Trazo { d: string; degradado?: number; papel?: 'palabra' | 'sa' | 'lema' }
export interface Dibujo { viewBox: string; degradados: { x1: string; y1: string; x2: string; y2: string }[]; paradas: [number, string][]; trazos: Trazo[] }
/** El isotipo: la C con la ruta. */
export const ISOTIPO: Dibujo = ${JSON.stringify(isotipo)};
/** Logotipo horizontal corto: isotipo y «COVICEN SA». */
export const LOGO_CORTO: Dibujo = ${JSON.stringify(corto)};
/** Logotipo horizontal largo: isotipo, «COVICEN SA» y «CORREDOR VIAL CENTRO». */
export const LOGO_LARGO: Dibujo = ${JSON.stringify(largo)};
`;
writeFileSync('src/assets/marca/marca.ts', ts);

// El isotipo suelto, con los ids de sus degradados propios (en og.svg conviven con otros).
const svgIsotipo = (ids) => {
  const defs = isotipo.degradados.map((g, i) => `<linearGradient id="${ids}${i}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${isotipo.paradas.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`).join('');
  const caminos = isotipo.trazos.map((t) => `<path d="${t.d}" fill="url(#${ids}${t.degradado})"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${isotipo.viewBox}" role="img" aria-label="Covicen"><defs>${defs}</defs>${caminos}</svg>\n`;
};
writeFileSync('src/assets/marca/isotipo.svg', svgIsotipo('iso-'));
writeFileSync('public/favicon.svg', svgIsotipo('g'));
console.log('ok', { isotipo: isotipo.viewBox, corto: corto.viewBox, largo: largo.viewBox });
