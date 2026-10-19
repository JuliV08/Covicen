// Páginas a las que el ClientRouter no puede llegar navegando adentro del sitio: se cargan siempre enteras.
//
// /contacto/ (01/10/2026): el formulario de Bitrix24 se monta una sola vez por carga de página. El router no vuelve a
// correr un script inline que ya corrió (lo reconoce por el texto, `detectScriptExecuted` de astro/transitions) y al
// salir de la página borra del <head> la hoja de estilos que Bitrix inyectó, que Bitrix no vuelve a poner. Ir a
// Contacto, pasar a Tarifas y volver dejaba el lugar del formulario vacío y, a los 4 segundos, el respaldo diciendo que
// algo lo bloqueaba: falso. Lo encontró la revisión leyendo el código, no un test.
//
// Queda aunque `contacto.formularioCrm` vuelva a null: cargar Contacto entera con el formulario propio no rompe nada.
// /proveedores/ desde el 02/10/2026, por el mismo motivo: también lleva el formulario de Bitrix.
const ENTERAS = ['contacto', 'proveedores'];

const sinBarras = (p: string) => p.replace(/^\/+|\/+$/g, '');

/** ¿Hay que llegar a `destino` (un pathname) con una carga completa? `base` es el base path del sitio. */
export const recargaCompleta = (destino: string, base: string): boolean => {
  const b = sinBarras(base);
  const d = sinBarras(destino);
  const relativa = b === '' ? d : d.startsWith(`${b}/`) ? d.slice(b.length + 1) : d === b ? '' : null;
  return relativa !== null && ENTERAS.includes(relativa);
};
