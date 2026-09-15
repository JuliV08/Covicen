// Freno de la cinta de avisos. WCAG 2.2.2: lo que se mueve solo y dura más de 5 segundos tiene que poder detenerse.
// El puntero encima y el foco adentro ya frenan por CSS (:hover / :focus-within); esto es el freno explícito, que es
// el único que sirve sin mouse y el único que dura: mientras esté pausado no vuelve a arrancar solo.
//
// El detalle que hace que «Reanudar» reanude de verdad: al hacer clic, el navegador deja el foco en el propio botón y
// el puntero encima, así que los dos frenos implícitos seguirían frenando la cinta y el botón mentiría sobre su
// estado. Por eso al reanudar se marca `data-corriendo`, que en el CSS le gana a `:hover` y a `:focus-within`, y se
// suelta cuando el usuario se va de la cinta: ahí los frenos implícitos vuelven a tener sentido.
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
    // set/remove explícitos en vez de toggleAttribute(nombre, forzar): el segundo argumento no es fiable en todos los
    // DOM (el de los tests, sin ir más lejos) y acá el estado tiene que quedar donde uno dice, no donde caiga.
    const marcar = (el: Element, nombre: string, puesto: boolean) => {
      if (puesto) el.setAttribute(nombre, '');
      else el.removeAttribute(nombre);
    };
    const rotular = () => {
      const pausado = raiz.hasAttribute('data-pausado');
      marcar(boton, 'data-pausado', pausado);
      boton.setAttribute('aria-label', boton.dataset[pausado ? 'reanudar' : 'pausar'] ?? '');
    };
    boton.addEventListener('click', () => {
      const pausado = !raiz.hasAttribute('data-pausado');
      marcar(raiz, 'data-pausado', pausado);
      marcar(raiz, 'data-corriendo', !pausado);
      rotular();
    });
    // Al salir de la cinta se sueltan los implícitos solos, así que la excepción deja de hacer falta.
    raiz.addEventListener('pointerleave', () => raiz.removeAttribute('data-corriendo'));
    // relatedTarget dice a dónde va el foco: saltar de un control al de al lado no es salir de la cinta.
    raiz.addEventListener('focusout', (e) => {
      const destino = (e as FocusEvent).relatedTarget as Node | null;
      if (!destino || !raiz.contains(destino)) raiz.removeAttribute('data-corriendo');
    });
    rotular();
  });
};
document.addEventListener('astro:page-load', iniciar);

export {};
