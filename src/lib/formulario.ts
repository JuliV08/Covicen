// El texto del mensaje que arma el formulario (para WhatsApp, correo o para copiar). Sin dependencias del DOM.
export interface CampoDelMensaje {
  etiqueta: string;
  valor: string;
}

/**
 * Una línea por campo con valor, con el asunto arriba. Los saltos de línea que escriba el usuario quedan
 * sangrados: si no, un campo libre podría fabricar una línea que el operador lea como otro campo
 * (una ubicación o una patente falsas).
 */
export const textoDelMensaje = (asunto: string, campos: CampoDelMensaje[]): string =>
  [
    `Asunto: ${asunto}`,
    ...campos
      .map((c) => ({ etiqueta: c.etiqueta, valor: c.valor.trim().replace(/\r?\n/g, '\n  ') }))
      .filter((c) => c.valor !== '')
      .map((c) => `${c.etiqueta}: ${c.valor}`),
  ].join('\n');
