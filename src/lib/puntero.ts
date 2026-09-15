// Dónde está el puntero dentro de un elemento, de -0,5 a 0,5 en cada eje. Vive acá, fuera del DOM, porque esta cuenta
// de tres líneas tuvo el bug más caro de la web y hace falta poder probarla sola.
//
// Qué pasaba (15/09/2026): el parallax del hero escucha `pointermove` en la SECCIÓN, no en su propio elemento —tiene
// que ser así, porque el elemento vive detrás de todo y el puntero nunca le llega—. Con una foto por tema hay DOS
// instancias en esa misma sección, y la que el tema esconde mide 0×0. Dividir por ese ancho da Infinity, el suavizado
// del bucle (`lerp`) de Infinity sigue siendo Infinity, y ese valor no se recupera nunca. Al cambiar de tema, esa
// instancia aparecía pidiéndole a la GPU un punto imposible de la textura y pintaba un manchón liso —el cielo de la
// foto—, tapando la foto entera. O sea: alcanzaba con pasar el mouse por el hero una vez para romperlo hasta recargar.

export type Caja = { left: number; top: number; width: number; height: number };

/** `null` cuando el elemento no tiene caja (lo esconde el tema) o cuando la cuenta no da un número: ahí no hay puntero
 *  que seguir y lo correcto es no tocar nada. El resultado siempre queda dentro de [-0,5, 0,5]. */
export const punteroRelativo = (caja: Caja, x: number, y: number): [number, number] | null => {
  if (!(caja.width > 0) || !(caja.height > 0)) return null;
  const rx = (x - caja.left) / caja.width - 0.5;
  const ry = (y - caja.top) / caja.height - 0.5;
  if (!Number.isFinite(rx) || !Number.isFinite(ry)) return null;
  const acotar = (v: number) => (v < -0.5 ? -0.5 : v > 0.5 ? 0.5 : v);
  return [acotar(rx), acotar(ry)];
};
