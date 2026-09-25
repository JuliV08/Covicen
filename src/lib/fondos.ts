// Las secciones de una página alternan fondo liso y grilla cinética. Cuando algunas se esconden (src/lib/publicado.ts,
// o porque falta un dato), el fondo escrito a mano deja dos iguales seguidas según qué esté prendido: pasaba en Tarifas
// desde el 20/09 (encabezado liso + Exenciones lisa) y en Medios de pago al aparecer la oficina virtual. Esto lo calcula
// sobre las que se ven. La primera va con grilla porque el encabezado de la página (el h1) es liso.
export type Fondo = 'fondo' | 'fondo-2';
export const alternarFondos = (visibles: boolean[]): Fondo[] => {
  let n = 0;
  return visibles.map((v) => (v && n++ % 2 === 0 ? 'fondo-2' : 'fondo'));
};
