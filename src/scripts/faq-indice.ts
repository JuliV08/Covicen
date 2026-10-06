// Índice de temas de /preguntas-frecuentes/: marca con aria-current el tema que está en pantalla. En el celular, además,
// corre la tira de temas para que el marcado quede a la vista. Qué tema se marca lo decide lib/indice.ts.
import { franjaDeLectura, temaEnPantalla } from '@/lib/indice';

let io: IntersectionObserver | null = null;
let soltar: (() => void) | null = null;
const suave = (): ScrollBehavior => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

const iniciar = () => {
  io?.disconnect();
  io = null;
  soltar?.();
  soltar = null;
  const indice = document.querySelector<HTMLElement>('[data-faq-indice]');
  const secciones = [...document.querySelectorAll<HTMLElement>('[data-tema-seccion]')];
  if (!indice || secciones.length === 0) return;
  const enlaces = new Map([...indice.querySelectorAll<HTMLAnchorElement>('[data-tema]')].map((a) => [a.dataset.tema!, a]));
  const orden = [...enlaces.keys()];
  const marcar = (tema: string) => {
    for (const [id, a] of enlaces) {
      if (id === tema) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
    const a = enlaces.get(tema);
    const tira = a?.closest('ul');
    if (a && tira && tira.scrollWidth > tira.clientWidth) tira.scrollTo({ left: a.parentElement!.offsetLeft - tira.offsetLeft - 16, behavior: suave() });
  };
  // Arriba de todo ninguna sección cruza la franja todavía: arranca marcado el primer tema. Al tocar uno, se marca en
  // el momento, sin esperar a que el desplazamiento llegue.
  marcar(orden[0]!);
  for (const [tema, a] of enlaces) a.addEventListener('click', () => marcar(tema));

  const enFranja = new Set<string>();
  const alFondo = () => innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
  let estabaAlFondo = alFondo();
  const actualizar = () => {
    const tema = temaEnPantalla(orden, enFranja, alFondo());
    if (tema) marcar(tema);
  };
  // La franja arranca en la línea donde aterrizan las anclas (el scroll-margin-top de las secciones), que cambia con el
  // ancho de la pantalla: se rearma al cambiar el tamaño de la ventana.
  const observar = () => {
    io?.disconnect();
    enFranja.clear();
    const linea = parseFloat(getComputedStyle(secciones[0]!).scrollMarginTop) || 0;
    io = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const tema = (e.target as HTMLElement).dataset.temaSeccion!;
          if (e.isIntersecting) enFranja.add(tema);
          else enFranja.delete(tema);
        }
        actualizar();
      },
      { rootMargin: franjaDeLectura(linea, innerHeight) },
    );
    secciones.forEach((s) => io!.observe(s));
  };
  observar();
  // El fondo de la página no lo ve el observer: se mira al desplazarse, y solo actúa cuando se llega o se sale.
  const alDesplazar = () => {
    const ahora = alFondo();
    if (ahora !== estabaAlFondo) { estabaAlFondo = ahora; actualizar(); }
  };
  let espera = 0;
  const alRedimensionar = () => { clearTimeout(espera); espera = window.setTimeout(observar, 200); };
  addEventListener('scroll', alDesplazar, { passive: true });
  addEventListener('resize', alRedimensionar);
  soltar = () => { removeEventListener('scroll', alDesplazar); removeEventListener('resize', alRedimensionar); clearTimeout(espera); };
};
document.addEventListener('astro:page-load', iniciar);

export {};
