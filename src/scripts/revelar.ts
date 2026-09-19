// Entradas de sección: agrega .visible la primera vez que el bloque entra en pantalla (todos los navegadores).
// Las entradas son de una sola vez a propósito: un reveal atado al scroll termina antes de que el ojo lo registre.
const iniciar = () => {
  const nodos = document.querySelectorAll<HTMLElement>('.revelar:not(.visible), .escalonar:not(.visible)');
  if (!nodos.length) return;
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
  );
  nodos.forEach((n) => io.observe(n));
};
document.addEventListener('astro:page-load', iniciar);

export {};
