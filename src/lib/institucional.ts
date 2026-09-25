// Sitios institucionales del pie. El PETG 61.6 exige Vialidad Nacional, Secretaría de Transporte y Presidencia; TelePASE
// va porque es el medio de pago de la red. Desde el 25/09/2026 van con su logo oficial (src/assets/institucional/: el
// README de esa carpeta dice de dónde sale cada uno), en el orden del ejemplo que pasó el equipo, de lo general a lo
// particular. Si falta el archivo de un logo, el pie muestra el nombre en texto.
// `alto` es la altura del logo en rem: los escudos con tres renglones y el logo vertical de Vialidad piden más alto que
// un logotipo de un solo renglón como el de TelePASE, que a la misma altura quedaría enorme.
import type { ImageMetadata } from 'astro';

export const enlacesInstitucionales = [
  { id: 'presidencia', nombre: 'Presidencia de la Nación', url: 'https://www.argentina.gob.ar/', alto: 3.25 },
  { id: 'transporte', nombre: 'Secretaría de Transporte', url: 'https://www.argentina.gob.ar/transporte', alto: 3.25 },
  { id: 'vialidad-nacional', nombre: 'Vialidad Nacional', url: 'https://www.argentina.gob.ar/transporte/vialidad-nacional', alto: 3.5 },
  { id: 'telepase', nombre: 'TelePASE', url: 'https://www.telepase.com.ar/', alto: 1.5 },
] as const;

/** La Red Federal de Concesiones no tiene logo propio: ni su página, ni los pliegos, ni el manual de Vialidad le
 *  dibujan uno (la nombran en texto). Va como enlace en el texto del pie, no en la fila de logos. */
export const redFederal = { nombre: 'Red Federal de Concesiones', url: 'https://www.argentina.gob.ar/transporte/vialidad-nacional/red-federal-de-concesiones' } as const;

export interface LogoInstitucional { url: string; proporcion: number }

// Los logos NO van adentro del HTML: los dos escudos pesan ~50 KB cada uno y se repetirían en las 27 páginas. Van como
// archivos aparte (`?url`), que el navegador baja una vez, y el pie los pinta como máscara del color del texto. La
// proporción sale del propio archivo (viewBox del SVG, medidas del PNG) para reservar el lugar sin saltos.
const svgUrl = import.meta.glob<string>('/src/assets/institucional/*.svg', { eager: true, query: '?url', import: 'default' });
const svgTexto = import.meta.glob<string>('/src/assets/institucional/*.svg', { eager: true, query: '?raw', import: 'default' });
const png = import.meta.glob<{ default: ImageMetadata }>('/src/assets/institucional/*.png', { eager: true });

/** Ancho sobre alto según el viewBox de un SVG; undefined si no tiene uno válido. */
export const proporcionSvg = (svg: string): number | undefined => {
  const [, , ancho, alto] = /viewBox="([^"]+)"/.exec(svg)?.[1]?.trim().split(/[\s,]+/).map(Number) ?? [];
  return ancho && alto && ancho > 0 && alto > 0 ? ancho / alto : undefined;
};

const buscar = <T>(archivos: Record<string, T>, nombre: string): T | undefined =>
  Object.entries(archivos).find(([ruta]) => ruta.endsWith(`/${nombre}`))?.[1];

export const logoInstitucional = (id: string): LogoInstitucional | undefined => {
  const url = buscar(svgUrl, `${id}.svg`);
  const proporcion = proporcionSvg(buscar(svgTexto, `${id}.svg`) ?? '');
  if (url && proporcion) return { url, proporcion };
  const imagen = buscar(png, `${id}.png`)?.default;
  return imagen ? { url: imagen.src, proporcion: imagen.width / imagen.height } : undefined;
};
