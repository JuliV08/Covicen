// Orden de la disolvencia del hero al cambiar de tema. Vive acá, separado del DOM, porque lo que importa es la
// SECUENCIA: si el tema se aplica antes de que el velo esté arriba, se ve el corte de una foto a la otra, que es
// justo lo que la disolvencia viene a tapar. tests/lib/disolvencia.test.ts fija ese orden.

/** Lo que la disolvencia necesita del mundo real. `null` = no hay velo (o el usuario pidió menos movimiento). */
export type Velo = {
  mostrar: () => void;
  ocultar: () => void;
  /** setTimeout, inyectado para poder probar la secuencia sin esperar. */
  esperar: (ms: number, fn: () => void) => void;
  /** requestAnimationFrame: hace falta un frame para que el navegador pinte el tema nuevo antes de destapar. */
  frame: (fn: () => void) => void;
};

/** Cuánto tarda el velo en tapar el hero. Tiene que coincidir con la transición de `.velo-tema` en global.css. */
export const ENTRADA_VELO = 200;

/** Red de seguridad: si los frames nunca llegan, el velo se baja igual a esta altura.
 *  Hace falta porque el navegador deja de entregar frames cuando la pestaña queda en segundo plano: si el usuario
 *  cambia de tema y se va a otra pestaña, el velo se quedaba tapando el hero (un panel liso donde debería estar la
 *  foto) y, peor, el cerrojo no se soltaba nunca más y la disolvencia moría para el resto de la visita. */
export const TOPE_VELO = 1000;

export const disolver = (cambiarTema: () => void, velo: Velo | null): void => {
  if (!velo) {
    cambiarTema();
    return;
  }
  // `ocultar` se llama una sola vez, venga por los frames o por la red de seguridad.
  let bajado = false;
  const bajar = () => {
    if (bajado) return;
    bajado = true;
    velo.ocultar();
  };
  velo.mostrar();
  velo.esperar(ENTRADA_VELO, () => {
    cambiarTema();
    // Dos frames: el primero pinta el tema nuevo debajo del velo, el segundo recién empieza a destaparlo.
    velo.frame(() => velo.frame(bajar));
  });
  velo.esperar(TOPE_VELO, bajar);
};
