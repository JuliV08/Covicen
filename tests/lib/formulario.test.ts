import { describe, expect, it } from 'vitest';
import { textoDelMensaje } from '@/lib/formulario';

describe('textoDelMensaje', () => {
  it('el asunto primero y una línea por campo con valor; los vacíos no entran', () => {
    expect(
      textoDelMensaje('Asistencia en ruta', [
        { etiqueta: 'Qué pasó', valor: 'Avería o desperfecto' },
        { etiqueta: 'Patente', valor: '   ' },
        { etiqueta: 'Teléfono', valor: ' 3415550000 ' },
      ]),
    ).toBe('Asunto: Asistencia en ruta\nQué pasó: Avería o desperfecto\nTeléfono: 3415550000');
  });

  // Un campo libre no puede fabricar una línea que el operador lea como otro campo (una ubicación o una patente falsas).
  it('los saltos de línea del usuario quedan sangrados: ninguna línea nueva arranca en la primera columna', () => {
    const texto = textoDelMensaje('Asistencia en ruta', [
      { etiqueta: 'Referencia', valor: 'RN 9, km 352\r\nUbicación: -31.00000, -61.00000' },
    ]);
    expect(texto).toBe('Asunto: Asistencia en ruta\nReferencia: RN 9, km 352\n  Ubicación: -31.00000, -61.00000');
    expect(texto.split('\n').filter((l) => /^\S/.test(l))).toEqual(['Asunto: Asistencia en ruta', 'Referencia: RN 9, km 352']);
  });
});
