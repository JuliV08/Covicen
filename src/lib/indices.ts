// Numeración corrida de las secciones de una página cuando algunas se esconden (src/lib/publicado.ts).
// Los números vivían escritos a mano en cada `indice=` de la página y quedaban salteados apenas se apagaba una
// sección. Con esto, prender un interruptor renumera solo.
export const indices = (visibles: boolean[]): (string | undefined)[] => {
  let n = 0;
  return visibles.map((v) => (v ? String(++n).padStart(2, '0') : undefined));
};
