// La UI formatea; los datos llegan crudos. Todo en es-AR.
const fmtMoneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
// Con centavos solo cuando los hay: el sistema puede publicar un cuadro redondeado al centavo (1.692,79).
const fmtMonedaCentavos = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtFechaLarga = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtFechaCorta = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });

const aFechaUtc = (iso: string): Date => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Fecha inválida: ${iso}`);
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

export const moneda = (n: number): string => (Math.round(n * 100) % 100 === 0 ? fmtMoneda : fmtMonedaCentavos).format(n);
export const conIva = (monto: number, alicuota: number): number => Math.round(monto * (1 + alicuota));
export const fechaLarga = (iso: string): string => fmtFechaLarga.format(aFechaUtc(iso));
export const fechaCorta = (iso: string): string => fmtFechaCorta.format(aFechaUtc(iso));
export const numero = (n: number, decimales = 0): string =>
  new Intl.NumberFormat('es-AR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(n);
/** Kilómetro para mostrar: "340", "19,95". */
export const kmTexto = (n: number): string => numero(n, Number.isInteger(n) ? 0 : 2);

const fmtFechaHora = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Argentina/Buenos_Aires' });
/** "13 de septiembre de 2026, 15:04" (hora Argentina). Para la fecha de última actualización del footer. */
export const fechaHoraLarga = (d: Date): string => fmtFechaHora.format(d).replace(' a las ', ', ').replace(/,\s*(\d{2}:\d{2})$/, ', $1');
