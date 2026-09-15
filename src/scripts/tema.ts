// Interruptor claro/oscuro. El snippet inline de Base.astro ya aplicó el tema antes de pintar; acá solo se conmuta,
// se persiste y se avisa (`tema:cambio`) a los canvas y al parallax, que leen colores o montan fotos según el tema.
import { disolver, type Velo } from '@/lib/disolvencia';
import { CLAVE_TEMA, COLOR_TEMA, otroTema, type Tema } from '@/lib/tema';

const temaActual = (): Tema => (document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro');

const pintarBotones = () => {
  const tema = temaActual();
  document.querySelectorAll<HTMLButtonElement>('[data-tema-boton]').forEach((b) => {
    b.hidden = false;
    b.setAttribute('aria-pressed', String(tema === 'claro'));
    b.setAttribute('aria-label', `Cambiar a tema ${otroTema(tema)}`);
  });
};

const aplicar = (tema: Tema) => {
  document.documentElement.dataset.tema = tema;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLOR_TEMA[tema]);
  try { localStorage.setItem(CLAVE_TEMA, tema); } catch { /* modo privado o sin storage: el tema dura la visita */ }
  pintarBotones();
  document.dispatchEvent(new CustomEvent('tema:cambio', { detail: { tema } }));
};

// Disolvencia del hero: intercambiar las dos fotos es un corte seco (el CSS las alterna con `display`) y encima el
// canvas del parallax se vuelve a montar. Con un velo del color del fondo que VIENE, el hero se funde, cambia por
// debajo y reaparece. El velo se tapa y se destapa SOLO, con la animación `velo-tema` de global.css: acá solo se la
// dispara y se suelta el cerrojo al final. El orden lo fija src/lib/disolvencia.ts.
const veloDe = (destino: Tema): Velo | null => {
  const el = document.querySelector<HTMLElement>('[data-velo-tema]');
  // Sin velo en la página, con "menos movimiento" o si ya hay una disolvencia en curso: el cambio va instantáneo.
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches || el.dataset.visible !== undefined) return null;
  const soltar = () => { delete el.dataset.visible; };
  return {
    mostrar: () => {
      el.style.background = COLOR_TEMA[destino];
      el.dataset.visible = '';
      // El propio fin de la animación suelta el cerrojo: no depende de ningún reloj ni de que lleguen cuadros.
      el.addEventListener('animationend', soltar, { once: true });
    },
    ocultar: soltar,
    esperar: (ms, fn) => { window.setTimeout(fn, ms); },
  };
};

const iniciar = () => {
  pintarBotones();
  document.querySelectorAll<HTMLButtonElement>('[data-tema-boton]:not([data-listo])').forEach((b) => {
    b.dataset.listo = '';
    b.addEventListener('click', () => {
      const destino = otroTema(temaActual());
      disolver(() => aplicar(destino), veloDe(destino));
    });
  });
};
document.addEventListener('astro:page-load', iniciar);

export {};
