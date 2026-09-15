import { config } from '@/lib/config';

/** Ruta interna con base y barra final. Ningún componente escribe `/` a mano: siempre `ruta('/tarifas')`. */
export const ruta = (path: string, base: string = config.base): string => {
  const [sinAncla, ancla] = path.split('#');
  let p = (sinAncla ?? '/').replace(/^\/+/, '');
  const esArchivo = /\.[a-z0-9]+$/i.test(p);
  if (p !== '' && !esArchivo && !p.endsWith('/')) p += '/';
  return `${base}${p}${ancla ? `#${ancla}` : ''}`;
};

export const absoluta = (path: string): string => `${config.sitio}${ruta(path)}`;

/** ¿Esta URL se puede enlazar? Guarda única para las URLs que llegan de los datos (el backend manda el tramo y el
 * tarifario): `javascript:` y `data:` en un href son ejecución de código con un click. El contrato ya las rechaza
 * (esquemas.ts), esto es el segundo candado, en el borde donde se escribe el href. */
export const esHttp = (url: string): boolean => /^https?:\/\//i.test(url);
