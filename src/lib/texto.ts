// Cierra una oración con punto sin duplicarlo. Un nombre que termina en «S.A.» ya trae el suyo: sin esto, la web
// publicaba «COVICEN S.A..» en Privacidad y «Guido Mogetta S.A..» en la descripción de Quiénes somos (02/10/2026).
export const conPunto = (texto: string): string => (texto.endsWith('.') ? texto : `${texto}.`);

// Espacios que no se cortan, para el texto de un enlace tel:. El número del 0800 («0800 444 7777») no puede quedar
// partido en dos renglones, y html-validate (tel-non-breaking, en scripts/verificar.ts) exige &nbsp; en todo espacio
// dentro de un <a href="tel:">.
export const sinCortes = (texto: string): string => texto.replace(/ /g, '\u00a0');

// Un horario no deja la unidad sola en el renglón de abajo: «18 h» va con espacio duro (29/10/2026). Solo ese espacio:
// el resto del horario tiene que poder partirse, porque en la columna del pie no entra en un renglón.
export const horaSinCorte = (texto: string): string => texto.replace(/(\d) h\b/g, '$1\u00a0h');
