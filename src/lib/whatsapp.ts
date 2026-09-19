export const enlaceWhatsapp = (numero: string, texto: string): string =>
  `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

/** Texto estructurado para el mensaje. Los campos vacíos no se incluyen. */
export const mensajeContacto = (asunto: string, campos: Record<string, string>): string =>
  [
    `Asunto: ${asunto}`,
    ...Object.entries(campos)
      .filter(([, v]) => v.trim() !== '')
      .map(([k, v]) => `${k}: ${v.trim()}`),
  ].join('\n');
