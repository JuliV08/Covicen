// Fallback para navegadores sin scroll-driven animations (Firefox estable, jun-2026).
// Donde hay soporte, no hace nada: el CSS se encarga.
const iniciar = () => {
  if (CSS.supports('animation-timeline: view()')) return;
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
    { rootMargin: '0px 0px -10% 0px' },
  );
  nodos.forEach((n) => io.observe(n));
};
document.addEventListener('astro:page-load', iniciar);

export {};
