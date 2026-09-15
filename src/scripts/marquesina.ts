// Freno de la cinta de avisos. WCAG 2.2.2: lo que se mueve solo y dura más de 5 segundos tiene que poder detenerse.
// El puntero encima y el foco adentro ya frenan por CSS (:hover / :focus-within); esto es el freno explícito, que es
// el único que sirve sin mouse y el único que dura: mientras esté pausado no vuelve a arrancar solo.
const iniciar = () => {
  document.querySelectorAll<HTMLElement>('[data-marquesina]:not([data-listo])').forEach((raiz) => {
    raiz.dataset.listo = '';
    const boton = raiz.querySelector<HTMLButtonElement>('[data-pausa]');
    if (!boton) return;
    // Con "menos movimiento" la cinta ya está quieta: un botón para frenar lo que no se mueve confunde más de lo que ayuda.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      boton.hidden = true;
      return;
    }
    const rotular = () => {
      const pausado = raiz.dataset.pausado !== undefined;
      boton.setAttribute('aria-label', boton.dataset[pausado ? 'reanudar' : 'pausar'] ?? '');
    };
    boton.addEventListener('click', () => {
      raiz.toggleAttribute('data-pausado');
      boton.toggleAttribute('data-pausado');
      rotular();
    });
    rotular();
  });
};
document.addEventListener('astro:page-load', iniciar);

export {};
