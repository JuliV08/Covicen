// Índice de temas de /preguntas-frecuentes/: marca con aria-current el tema que está en pantalla. En el celular, además,
// corre la tira de temas para que el marcado quede a la vista.
let io: IntersectionObserver | null = null;
const iniciar = () => {
  io?.disconnect();
  io = null;
  const indice = document.querySelector<HTMLElement>('[data-faq-indice]');
  if (!indice) return;
  const enlaces = new Map([...indice.querySelectorAll<HTMLAnchorElement>('[data-tema]')].map((a) => [a.dataset.tema!, a]));
  const marcar = (tema: string) => {
    for (const [id, a] of enlaces) {
      if (id === tema) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
    const a = enlaces.get(tema);
    const tira = a?.closest('ul');
    if (a && tira && tira.scrollWidth > tira.clientWidth) tira.scrollTo({ left: a.parentElement!.offsetLeft - tira.offsetLeft - 16, behavior: 'smooth' });
  };
  // Arriba de todo ninguna sección cruza la franja todavía: arranca marcado el primer tema.
  const primero = enlaces.keys().next().value;
  if (primero) marcar(primero);
  // La franja de lectura va del 30 % al 45 % de la pantalla: el tema marcado es el que la está cruzando. Si la cruzan
  // dos (el final de uno y el principio del otro), el de arriba, que es el que se está terminando de leer.
  const enFranja = new Set<string>();
  io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        const tema = (e.target as HTMLElement).dataset.temaSeccion!;
        if (e.isIntersecting) enFranja.add(tema);
        else enFranja.delete(tema);
      }
      const arriba = [...enlaces.keys()].find((t) => enFranja.has(t));
      if (arriba) marcar(arriba);
    },
    { rootMargin: '-30% 0px -55% 0px' },
  );
  document.querySelectorAll<HTMLElement>('[data-tema-seccion]').forEach((s) => io!.observe(s));
};
document.addEventListener('astro:page-load', iniciar);

export {};
