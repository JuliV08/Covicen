// Luz que sigue al cursor sobre [data-spotlight] (cards, hero). Un solo listener delegado; nada en touch.
let instalado = false;
const iniciar = () => {
  if (instalado || matchMedia('(hover: none)').matches) return;
  instalado = true;
  document.addEventListener(
    'pointermove',
    (e) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>('[data-spotlight]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    },
    { passive: true },
  );
};
document.addEventListener('astro:page-load', iniciar);

export {};
