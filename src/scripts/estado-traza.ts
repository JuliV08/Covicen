// Estado de la traza en vivo (spec del sistema 3, §8.6). El build emite el armazón (EstadoTraza.astro) y, si en la
// página hay mapa, la capa vacía y la geometría de los km (MapaTramo.astro). Esto consulta la API al entrar, cada
// 2 minutos con la pestaña a la vista y al volver a ella, y pinta lo que llega (lib/estado-dom.ts). Se engancha como
// scripts/pestanas-tarifas.ts: lo que queda colgado se suelta en la carga siguiente (navegación del ClientRouter).
import { aplicarEstado } from '@/lib/estado-dom';
import { consultarEstado, REFRESCO_MS } from '@/lib/estado-en-vivo';
import type { GeometriaKm } from '@/lib/geometria-km';

let soltar: (() => void) | null = null;

const geometriaDe = (svg: Element | null): GeometriaKm => {
  try {
    return svg ? (JSON.parse(svg.getAttribute('data-geometria-km') ?? '{}') as GeometriaKm) : {};
  } catch {
    return {};
  }
};

const iniciar = () => {
  soltar?.();
  soltar = null;
  const seccion = document.querySelector<HTMLElement>('[data-estado-en-vivo]');
  const url = seccion?.dataset.url;
  if (!seccion || !url) return;
  const capa = document.querySelector<SVGGElement>('[data-marcadores-estado]');
  const geo = geometriaDe(document.querySelector('[data-geometria-km]'));
  let vigente = true;
  let enCurso = false;
  // Si la respuesta es la misma que la anterior no se repinta: la lista es una región viva y el lector de pantalla
  // volvería a leer todas las rutas cada 2 minutos.
  let anterior: string | undefined;
  const consultar = async () => {
    if (enCurso) return;
    enCurso = true;
    const estado = await consultarEstado(url);
    enCurso = false;
    const firma = JSON.stringify(estado);
    if (!vigente || firma === anterior) return;
    anterior = firma;
    aplicarEstado(seccion, capa, estado, geo);
  };
  const siSeVe = () => {
    if (document.visibilityState === 'visible') void consultar();
  };
  const reloj = setInterval(siSeVe, REFRESCO_MS);
  document.addEventListener('visibilitychange', siSeVe);
  void consultar();
  soltar = () => {
    vigente = false;
    clearInterval(reloj);
    document.removeEventListener('visibilitychange', siSeVe);
  };
};
document.addEventListener('astro:page-load', iniciar);

export {};
