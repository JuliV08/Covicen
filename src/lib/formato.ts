// La UI formatea; los datos llegan crudos. Todo en es-AR.
const fmtMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const fmtFechaLarga = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtFechaCorta = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const aFechaUtc = (iso: string): Date => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

export const moneda = (n: number): string => fmtMoneda.format(n);
export const conIva = (monto: number, alicuota: number): number => Math.round(monto * (1 + alicuota));
export const fechaLarga = (iso: string): string => fmtFechaLarga.format(aFechaUtc(iso));
export const fechaCorta = (iso: string): string => fmtFechaCorta.format(aFechaUtc(iso));
export const numero = (n: number, decimales = 0): string =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);
