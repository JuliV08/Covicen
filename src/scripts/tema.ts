// Interruptor claro/oscuro. El snippet inline de Base.astro ya aplicó el tema antes de pintar; acá solo se conmuta,
// se persiste y se avisa (`tema:cambio`) a los canvas y al parallax, que leen colores o montan fotos según el tema.
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

const iniciar = () => {
  pintarBotones();
  document.querySelectorAll<HTMLButtonElement>('[data-tema-boton]:not([data-listo])').forEach((b) => {
    b.dataset.listo = '';
    b.addEventListener('click', () => aplicar(otroTema(temaActual())));
  });
};
document.addEventListener('astro:page-load', iniciar);

export {};
