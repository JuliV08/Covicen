// Ids estables entre builds para elementos que pueden repetirse en una página (dos mapas, por ejemplo): un contador por
// prefijo en el proceso de build. Math.random cambiaba el HTML emitido en cada build sin que cambiara nada.
const contadores = new Map<string, number>();

export const idEstable = (prefijo: string): string => {
  const n = (contadores.get(prefijo) ?? 0) + 1;
  contadores.set(prefijo, n);
  return `${prefijo}-${n}`;
};
