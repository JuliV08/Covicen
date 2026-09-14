// El texto de la ubicación que se dicta al 140 o viaja en el mensaje. Sin dependencias del DOM.
export const textoUbicacion = (lat: number, lng: number, precision?: number): string => {
  const a = lat.toFixed(5);
  const b = lng.toFixed(5);
  const p = precision === undefined ? '' : ` (±${Math.round(precision)} m)`;
  return `${a}, ${b}${p} · https://maps.google.com/?q=${a},${b}`;
};
