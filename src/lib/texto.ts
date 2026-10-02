// Cierra una oración con punto sin duplicarlo. Un nombre que termina en «S.A.» ya trae el suyo: sin esto, la web
// publicaba «COVICEN S.A..» en Privacidad y «Guido Mogetta S.A..» en la descripción de Quiénes somos (02/10/2026).
export const conPunto = (texto: string): string => (texto.endsWith('.') ? texto : `${texto}.`);
