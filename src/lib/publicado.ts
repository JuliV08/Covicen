// Qué está confirmado y qué no. ÚNICO lugar del sitio donde se decide si una sección se publica.
//
// Regla de la casa (desde sept. 2026): esconder, no «a confirmar». Un dato que el área todavía no certificó no se
// publica con salvedades: la sección entera no se renderiza, y el pedido de confirmación vive en
// docs/pendientes-de-confirmacion.md, que es lo que Juli le lleva al gerente.
//
// Para volver a mostrar algo: cambiar su `false` por `true`. Nada más. El que carga el dato no tiene que entender
// código ni buscar dónde estaba el `if`. Si algún día una sección necesita más que un booleano, la complejidad va
// en el componente, NO acá: este archivo se lee de un vistazo o no sirve para lo que fue hecho. Lo guarda
// tests/lib/publicado.test.ts, que lo revienta si aparece lógica, un import o una variable de entorno.
//
// No confundir con src/lib/datos/capacidades.ts: aquello es «el sistema todavía no existe» (portal de proveedores,
// canal ético anónimo) y muestra un hueco con una alternativa real. Esto es «el dato existe pero nadie lo
// certificó», y no muestra nada: ni el rótulo, ni un guion, ni un «próximamente».
//
// Criterio del 20/09/2026 (call con el gerente): queda lo que tiene fuente oficial publicada —el cuadro tarifario de
// la Res. 248/2026, las exenciones del contrato, los trámites nacionales de argentina.gob.ar— y se esconde todo lo
// que dependa de que alguien del área diga «sí, es así».
export const publicado = Object.freeze({
  /** Página /obras/ y sus enlaces. Momentáneo: «no se sabe nada del tema obras». El contenido queda en el repo. */
  obras: false,
  /** Tarifas 01 · «que esté certificada la info del porcentaje que te van a descontar». */
  descuentosPorFrecuencia: false,
  /** Tarifas 03 · vecinos, frentistas y docentes: «certificar ese tema primero con el responsable del área». */
  tarifaDiferencial: false,
  /** Recargos por pasar sin pagar: «certificar que va a ser así». Gobierna las DOS apariciones del mismo dato,
   *  Tarifas 04 y Medios de pago 04: un dato sin certificar, un interruptor. */
  pasasteSinPagar: false,
  /** Tarifas 05 · multiplicadores por exceso de carga. Mismo pedido del área, por los recargos. */
  excesoDeCarga: false,
  /** Tarifas 06 · «categorías que van a regir después», en la lista de certificar. */
  categoriasFuturas: false,
  /** Trámites · tarifa diferencial de vecinos, frentistas y docentes. Es el trámite de lo que esconde
   *  `tarifaDiferencial`, y va aparte porque el trámite podría confirmarse antes que el monto. */
  tramiteVecinosFrentistas: false,
  /** El tramo 04 · qué hay de verdad en cada área de descanso (agua, sanitarios, detención segura).
   *  Acá el dato directamente no existe: nadie lo cargó todavía en src/content/tramo.json. */
  serviciosDeAreaDescanso: false,
  /** Contacto · formulario de consultas de TelePASE. Se escondió el 24/09/2026 «hasta que definamos si va a haber o
   *  no oficina virtual» y volvió el 25/09, cuando se definió (Autogestión de Telepeaje Plus). El PETG art. 61.5 b
   *  obliga a tenerlo desde la toma de posesión, haya o no oficina virtual: apagarlo de nuevo es incumplir el pliego. */
  formularioTelepase: true,
});

export type ClavePublicada = keyof typeof publicado;
