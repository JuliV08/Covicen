// Mojones: cuentan de 0 al valor la primera vez que entran en pantalla. El HTML ya trae el número real.
const animar = (el: HTMLElement) => {
  const meta = Number(el.dataset.contador);
  if (!Number.isFinite(meta)) return;
  const fmt = new Intl.NumberFormat('es-AR');
  const duracion = 1400;
  const t0 = performance.now();
  const paso = (t: number) => {
    const p = Math.min(1, (t - t0) / duracion);
    const e = 1 - (1 - p) ** 4; // ease-out-quart, como --ease-salida
    el.textContent = fmt.format(Math.round(meta * e));
    if (p < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
};
const iniciar = () => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const nodos = document.querySelectorAll<HTMLElement>('[data-contador]:not([data-animado])');
  if (!nodos.length) return;
  const io = new IntersectionObserver(
    (entradas) => {
      for (const en of entradas) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        el.dataset.animado = '';
        animar(el);
        io.unobserve(el);
      }
    },
    { threshold: 0.5 },
  );
  nodos.forEach((n) => io.observe(n));
};
document.addEventListener('astro:page-load', iniciar);

export {};
