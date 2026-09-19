// Cierra el desplegable "Nosotros" con Esc o clic afuera. ~350 B.
// Los listeners van una sola vez sobre document (sobrevive a las view transitions); los <details> se buscan al momento.
let instalado = false;
const desplegables = () => document.querySelectorAll<HTMLDetailsElement>('[data-desplegable]');
const iniciar = () => {
  if (instalado) return;
  instalado = true;
  document.addEventListener('click', (e) => {
    desplegables().forEach((d) => {
      if (d.open && !d.contains(e.target as Node)) d.open = false;
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    desplegables().forEach((d) => {
      if (!d.open) return;
      d.open = false;
      d.querySelector<HTMLElement>('summary')?.focus();
    });
  });
};
document.addEventListener('astro:page-load', iniciar);

export {};
