// Orden de la disolvencia del hero al cambiar de tema. Vive acá, separado del DOM, porque lo que importa es la
// SECUENCIA: si el tema se aplica antes de que el velo esté arriba, se ve el corte de una foto a la otra, que es
// justo lo que la disolvencia viene a tapar. tests/lib/disolvencia.test.ts fija ese orden.
//
// Quién hace qué: el velo se tapa y se destapa SOLO, con una animación de CSS (`velo-tema`, en global.css). Este
// módulo no lo baja: solo elige el momento de cambiar el tema (cuando la animación está tapando del todo) y suelta el
// cerrojo cuando la animación terminó, para que el próximo cambio la pueda volver a disparar. La versión anterior
// bajaba el velo desde JS con dos requestAnimationFrame, y eso lo hacía depender de que el navegador entregara
// cuadros: con la pestaña en segundo plano el velo se quedaba tapando el hero y la disolvencia moría para el resto de
// la visita. Ahora, aunque este código no corra nunca, el velo termina transparente.

/** Lo que la disolvencia necesita del mundo real. `null` = no hay velo (o el usuario pidió menos movimiento). */
export type Velo = {
  /** Dispara la animación del velo. */
  mostrar: () => void;
  /** Suelta el cerrojo para que la próxima disolvencia pueda disparar la animación de nuevo. No apaga nada. */
  ocultar: () => void;
  /** setTimeout, inyectado para poder probar la secuencia sin esperar. */
  esperar: (ms: number, fn: () => void) => void;
};

/** Cuándo el velo tapa del todo, y por lo tanto cuándo se puede cambiar el tema sin que se vea el corte.
 *  Es el fotograma de opacidad 1 de `@keyframes velo-tema` en global.css; el test los mantiene atados. */
export const ENTRADA_VELO = 200;

/** Cuánto dura la animación entera. Cuando termina, el velo ya está transparente y el cerrojo se puede soltar. */
export const SALIDA_VELO = 625;

export const disolver = (cambiarTema: () => void, velo: Velo | null): void => {
  if (!velo) {
    cambiarTema();
    return;
  }
  velo.mostrar();
  velo.esperar(ENTRADA_VELO, cambiarTema);
  velo.esperar(SALIDA_VELO, velo.ocultar);
};
