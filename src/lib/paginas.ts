// Qué páginas del menú y del pie se publican. Las que se esconden con un interruptor de lib/publicado.ts no se
// generan (ruta rest con getStaticPaths vacío), así que un enlace a ellas sería un enlace roto: el menú y el pie
// filtran por acá. Pedido del gerente del 01/10/2026: «los ajustes que vamos haciendo se tienen que ajustar también
// en el footer; si ocultás la de políticas y la de transparencia, ahí abajo no tiene que estar».
import { publicado } from '@/lib/publicado';

const APAGADAS: Record<string, boolean> = {
  '/obras': !publicado.obras,
  '/politicas': !publicado.politicas,
  '/responsabilidad-civil': !publicado.transparencia,
  '/proveedores': !publicado.proveedores,
};

export const paginaPublicada = (href: string): boolean => !APAGADAS[href];
