// Cierra el desplegable "Nosotros" con Esc o clic afuera. ~300 B.
const iniciar = () => {
  const desplegables = document.querySelectorAll<HTMLDetailsElement>('[data-desplegable]');
  if (!desplegables.length) return;
  document.addEventListener('click', (e) => {
    desplegables.forEach((d) => {
      if (d.open && !d.contains(e.target as Node)) d.open = false;
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') desplegables.forEach((d) => { d.open = false; });
  });
};
document.addEventListener('astro:page-load', iniciar);

// Convierte el archivo en módulo: sin esto, TypeScript comparte el ámbito global entre scripts.
export {};
