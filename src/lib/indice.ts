// Lo que decide qué tema marca el índice de /preguntas-frecuentes/ (scripts/faq-indice.ts). Sin DOM, para poder
// probarlo solo.

/** La franja de lectura: empieza en la línea donde aterriza un ancla (el scroll-margin-top de las secciones, debajo
 *  del header y de la tira de temas) y mide un cuarto de la pantalla. Devuelve el rootMargin del IntersectionObserver.
 *  Con una franja fija en porcentajes, en una pantalla alta un tema corto terminaba antes de que empezara la franja y
 *  quedaba marcado el siguiente (revisión del 05/10/2026: se tocaba «Pago» y se marcaba «Servicios»). */
export const franjaDeLectura = (lineaAncla: number, altoVentana: number): string => {
  const arriba = Math.max(0, Math.round(lineaAncla));
  const abajo = Math.max(0, Math.round(altoVentana - arriba - altoVentana * 0.25));
  return `-${arriba}px 0px -${abajo}px 0px`;
};

/** El tema que se marca. Al fondo de la página, el último: no puede subir hasta la franja y nunca se marcaría. Si no,
 *  el primero, en el orden del índice, que cruza la franja (si la cruzan dos, el de arriba, que es el que se está
 *  terminando de leer). Si ninguno la cruza, null: queda marcado el que estaba. */
export const temaEnPantalla = (orden: readonly string[], enFranja: ReadonlySet<string>, alFondo: boolean): string | null =>
  alFondo ? (orden.at(-1) ?? null) : (orden.find((t) => enFranja.has(t)) ?? null);

/** El paso del formulario del CRM, leído del contador que Bitrix escribe en su círculo de progreso («1/2»). Lo usa
 *  FormularioCrm.astro para la barra de pasos; con cualquier otra cosa, null, y queda el círculo de Bitrix. */
export const pasoDeBitrix = (texto: string): { progreso: number; rotulo: string } | null => {
  const r = /(\d+)\s*\/\s*(\d+)/.exec(texto);
  if (!r) return null;
  const paso = Number(r[1]);
  const pasos = Number(r[2]);
  if (pasos < 1 || paso < 1 || paso > pasos) return null;
  return { progreso: paso / pasos, rotulo: `Paso ${paso} de ${pasos}` };
};
