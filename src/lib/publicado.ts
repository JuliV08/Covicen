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
   *  no oficina virtual», volvió el 25/09 y se escondió otra vez el 05/10: «el único que vamos a usar es el del CRM».
   *  OJO: el PETG art. 61.5 b lo pide desde la toma de posesión; ver docs/pendientes-de-confirmacion.md (la salida es
   *  que el formulario del CRM de PREVI tome también las consultas de TelePASE). */
  formularioTelepase: false,

  // Reunión con el gerente del 01/10/2026 (revisión de la web con el equipo). Los de esta tanda que dicen «a
  // confirmar» o «falta solicitar» son datos sin confirmar y se esconden donde aparezcan; el resto son secciones
  // que se pidió esconder. El pedido, en docs/pendientes-de-confirmacion.md.
  /** Quiénes somos · «Qué asume Covicen»: las ocho obligaciones del contrato. Pedido de esconderla. */
  queAsumimos: false,
  /** Quiénes somos · «Quién nos controla»: régimen, plazo, adjudicación, control, misión y visión. Pedido de esconderla. */
  quienNosControla: false,
  /** Servicios · «Servicios que se cobran» (mecánica general, remolque más allá del punto gratuito). Pedido de esconderla. */
  serviciosConCosto: false,
  /** Servicios · la tabla «Canales y plazos de respuesta». Pedido de esconderla; la tabla sigue en Contacto y en
   *  Emergencias. */
  canalesEnServicios: false,
  /** Que TelePASE no le cuesta nada al usuario (adhesión, dispositivo, colocación…): «a confirmar». Gobierna TODAS
   *  las apariciones del dato: la tarjeta de Servicios, Medios de pago, la home y la pregunta frecuente. */
  telepaseSinCosto: false,
  /** Servicios · «Sanitarios públicos»: «a confirmar». */
  sanitariosPublicos: false,
  /** El canal de WhatsApp: «falta solicitar». La fila de la tabla de canales y las menciones que lo prometen. */
  canalWhatsapp: false,

  // Segunda tanda de la misma reunión (02/10/2026).
  /** Página /politicas/ (calidad, seguridad vial, anticorrupción): «no es para este momento», hace falta una
   *  consultoría para escribirlas. No se genera, y sale del menú y del pie. */
  politicas: false,
  /** Página de la póliza de responsabilidad civil, en /responsabilidad-civil/ desde el 06/10/2026 (antes /transparencia/:
   *  «el endpoint sigue diciendo /transparencia/, cuando debe decir responsabilidad civil»). Escondida el 02/10/2026 y de
   *  vuelta el 05/10, cuando llegó la póliza («agregarla donde estaba originalmente la de ejemplo»). */
  transparencia: true,
  /** Página /proveedores/ (registro de proveedores). Escondida el 05/10/2026 por pedido de Juli. No se genera, y sale
   *  del menú, del pie y de la política de privacidad. */
  proveedores: false,
  /** Transparencia · la normativa aplicable para descargar. Sigue escondida desde el 02/10/2026: el 05/10 volvió la
   *  página por la póliza, no la normativa. OJO: el PETG 61.6 pide publicarla; ver docs/pendientes-de-confirmacion.md. */
  normativa: false,
  /** El estado de la traza (cortes, obras, clima) en El tramo: hoy son datos de ejemplo. «Comentar hasta que tengamos
   *  info.» Esconde el bloque, el cartel de «datos de ejemplo» y los marcadores del mapa. */
  estadoDeLaTraza: false,
  /** Guía de trámites · el formulario «Iniciá tu trámite»: no hay nadie del otro lado que lo atienda. Los trámites
   *  se inician desde Contacto, por el CRM. */
  formularioTramites: false,

  // Tercera tanda (05/10/2026).
  /** Emergencias · la tarjeta «Grúa y remolque para despejar la calzada: gratis y con tiempos comprometidos».
   *  Pedido: «Comentar». El mismo servicio, con los mismos tiempos, sigue en Servicios y en una pregunta frecuente. */
  gruaEnEmergencias: false,
});

export type ClavePublicada = keyof typeof publicado;
