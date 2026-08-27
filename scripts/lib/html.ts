import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** Lista recursiva de archivos .html bajo un directorio. */
export const paginasDe = (dir: string): string[] => {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...paginasDe(ruta));
    else if (nombre.endsWith('.html')) salida.push(ruta);
  }
  return salida;
};

/** hrefs internos (empiezan con "/"), sin ancla, sin duplicar el protocolo. */
export const linksInternos = (html: string): string[] =>
  [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1]!)
    .filter((h) => h.startsWith('/') && !h.startsWith('//'))
    .map((h) => h.split('#')[0]!)
    .filter((h) => h !== '');

/** '/covicen/tarifas/' + base '/covicen/' → 'tarifas/index.html' */
export const normalizarHref = (href: string, base: string): string => {
  const sinBase = href.startsWith(base) ? href.slice(base.length) : href.replace(/^\//, '');
  if (sinBase === '' || sinBase.endsWith('/')) return `${sinBase}index.html`;
  return sinBase;
};

export const existeDestino = (dist: string, base: string, href: string): boolean =>
  existsSync(join(dist, normalizarHref(href, base)));

export const jsonLdDe = (html: string): unknown[] =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]!));
