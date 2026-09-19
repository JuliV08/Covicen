// Flip card: en pantallas táctiles (sin hover) un toque da vuelta la card; un segundo toque la vuelve.
const iniciar = () => {
  if (!matchMedia('(hover: none)').matches) return;
  document.querySelectorAll<HTMLElement>('[data-flip]:not([data-listo])').forEach((f) => {
    f.dataset.listo = '';
    f.addEventListener('click', (e) => {
      // Un link del dorso navega normalmente; cualquier otro toque alterna.
      if ((e.target as Element).closest('a')) return;
      f.classList.toggle('volteada');
    });
  });
};
document.addEventListener('astro:page-load', iniciar);

export {};
