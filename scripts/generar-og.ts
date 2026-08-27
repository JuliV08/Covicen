// Genera public/og.png (1200x630) y public/apple-touch-icon.png (180x180) desde los SVG de marca.
// Corre con `node scripts/generar-og.ts` (Node ≥ 22.6 ejecuta TS sin transpilar).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const fuentes = ['scripts/fuentes/Archivo-ExtraBold.ttf', 'scripts/fuentes/Archivo-Regular.ttf'];
const isotipoSvg = readFileSync('src/assets/marca/isotipo.svg', 'utf8');
// Nos quedamos solo con el <path>; el gradiente "g" ya está definido en og.svg.
const pathIsotipo = /<path[^>]*\/>/.exec(isotipoSvg)?.[0];
if (!pathIsotipo) throw new Error('No encontré el <path> del isotipo');
const isotipo = `<g transform="translate(-120 -120)">${pathIsotipo}</g>`;

const renderizar = (svg: string, ancho: number, salida: string) => {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: ancho },
    font: { fontFiles: fuentes, loadSystemFonts: false, defaultFontFamily: 'Archivo' },
  });
  writeFileSync(salida, r.render().asPng());
  console.log('ok', salida);
};

mkdirSync('public', { recursive: true });
renderizar(readFileSync('src/assets/marca/og.svg', 'utf8').replace('ISOTIPO', isotipo), 1200, 'public/og.png');
renderizar(isotipoSvg, 180, 'public/apple-touch-icon.png');
