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

export const disolver = (cambiarTema: () => void, velo: Velo | null): void => {
  if (!velo) {
    cambiarTema();
    return;
  }
  velo.mostrar();
  velo.esperar(ENTRADA_VELO, () => {
    cambiarTema();
    // Dos frames: el primero pinta el tema nuevo debajo del velo, el segundo recién empieza a destaparlo.
    velo.frame(() => velo.frame(() => velo.ocultar()));
  });
};
