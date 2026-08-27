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
