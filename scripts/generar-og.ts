// Genera public/og.png (1200x630, la imagen que se ve al compartir un link) y public/apple-touch-icon.png (180x180, el
// ícono de la pantalla de inicio del iPhone) desde el logo del manual de marca de septiembre de 2026.
// Corre con `node scripts/generar-og.ts` (Node ≥ 22.6 ejecuta TS sin transpilar).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { LOGO_LARGO, type Dibujo } from '../src/assets/marca/marca.ts';

const fuentes = ['scripts/fuentes/Archivo-ExtraBold.ttf', 'scripts/fuentes/Archivo-Regular.ttf'];

// Un dibujo del logo como <svg> anidado, con los colores de la palabra, la SA y el lema que se le pasen (en la imagen
// de redes, el negativo del manual: el fondo es oscuro).
const anidar = (d: Dibujo, prefijo: string, colores: Record<'palabra' | 'sa' | 'lema', string>, posicion: string) => {
  const defs = d.degradados.map((g, i) => `<linearGradient id="${prefijo}${i}" gradientUnits="userSpaceOnUse" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${d.paradas.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`).join('');
  const caminos = d.trazos.map((t) => `<path d="${t.d}" fill="${t.degradado !== undefined ? `url(#${prefijo}${t.degradado})` : colores[t.papel!]}"/>`).join('');
  return `<svg ${posicion} viewBox="${d.viewBox}"><defs>${defs}</defs>${caminos}</svg>`;
};

const renderizar = (svg: string, ancho: number, salida: string) => {
  const r = new Resvg(svg, {
    fitTo: { mode: 'width', value: ancho },
    font: { fontFiles: fuentes, loadSystemFonts: false, defaultFontFamily: 'Archivo' },
  });
  writeFileSync(salida, r.render().asPng());
  console.log('ok', salida);
};

mkdirSync('public', { recursive: true });
const logo = anidar(LOGO_LARGO, 'logo-', { palabra: '#FFFFFF', sa: '#68B6DC', lema: '#A9C4D8' }, 'x="96" y="140" width="640" height="130"');
renderizar(readFileSync('src/assets/marca/og.svg', 'utf8').replace('LOGO', logo), 1200, 'public/og.png');
// El ícono del iPhone: el isotipo sobre blanco, con aire, como en las aplicaciones del manual. Sin fondo, iOS lo
// pondría sobre negro.
const isotipo = readFileSync('src/assets/marca/isotipo.svg', 'utf8').replace('<svg ', '<svg x="22" y="22" width="136" height="136" ');
renderizar(`<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" fill="#FFFFFF"/>${isotipo}</svg>`, 180, 'public/apple-touch-icon.png');
