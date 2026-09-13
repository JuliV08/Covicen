// Pares (texto, fondo) que el sitio usa. Los verifica verificar.ts (en el build) y tests/styles/tokens.test.ts, en LOS DOS temas.
// Regla: `vial` es solo fondo (texto encima: sobre-vial); el amarillo como texto es `vial-texto`. `texto-3` nunca va sobre superficies.
export const paresContraste: Array<[string, string]> = [
  ['texto', 'fondo'], ['texto-2', 'fondo'], ['texto-3', 'fondo'], ['acento', 'fondo'], ['vial-texto', 'fondo'], ['error', 'fondo'], ['ok', 'fondo'],
  ['texto', 'fondo-2'], ['texto-2', 'fondo-2'], ['texto-3', 'fondo-2'], ['acento', 'fondo-2'], ['ok', 'fondo-2'],
  ['texto', 'superficie'], ['texto-2', 'superficie'], ['acento', 'superficie'], ['vial-texto', 'superficie'], ['ok', 'superficie'], ['error', 'superficie'],
  ['texto', 'superficie-2'], ['texto-2', 'superficie-2'],
  ['sobre-vial', 'vial'], ['sobre-acento', 'acento'], ['sobre-ok', 'ok'],
];
