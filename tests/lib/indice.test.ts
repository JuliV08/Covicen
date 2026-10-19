import { describe, expect, it } from 'vitest';
import { franjaDeLectura, pasoDeBitrix, temaEnPantalla } from '@/lib/indice';

const ORDEN = ['general', 'tarifas', 'peajes', 'pago', 'servicios', 'empresa'];

describe('índice de /preguntas-frecuentes/', () => {
  // El caso de la revisión del 05/10/2026: a 1920 × 1080, el ancla deja «Pago» entre 144 y 270 px; con la franja vieja
  // (del 30 al 45 %, de 324 a 486 px) Pago ni la tocaba y se marcaba «Servicios».
  it('la franja empieza donde aterriza el ancla y mide un cuarto de la pantalla', () => {
    expect(franjaDeLectura(144, 1080)).toBe('-144px 0px -666px 0px');
    const [arriba, , abajo] = franjaDeLectura(144, 1080).split(' ').map((v) => -parseFloat(v));
    expect(arriba).toBeLessThanOrEqual(144);
    expect(1080 - abajo!).toBeGreaterThan(270);
  });
  it('nunca da márgenes positivos, ni en una ventana más baja que el ancla', () => {
    expect(franjaDeLectura(152, 120)).toBe('-152px 0px -0px 0px');
  });
  it('si la cruzan dos temas, marca el de arriba', () => {
    expect(temaEnPantalla(ORDEN, new Set(['servicios', 'pago']), false)).toBe('pago');
  });
  it('al fondo de la página marca el último, aunque no llegue a la franja', () => {
    expect(temaEnPantalla(ORDEN, new Set(['servicios']), true)).toBe('empresa');
  });
  it('si ninguno cruza la franja, no cambia nada', () => {
    expect(temaEnPantalla(ORDEN, new Set(), false)).toBeNull();
  });
});

describe('pasos del formulario del CRM', () => {
  it('lee el contador de Bitrix', () => {
    expect(pasoDeBitrix('1/2')).toEqual({ progreso: 0.5, rotulo: 'Paso 1 de 2' });
    expect(pasoDeBitrix('\n\t2 / 2 ')).toEqual({ progreso: 1, rotulo: 'Paso 2 de 2' });
  });
  it('con cualquier otra cosa, null: queda el círculo de Bitrix', () => {
    for (const texto of ['', 'Datos de contacto', '3/2', '0/2', '1/0']) expect(pasoDeBitrix(texto), texto).toBeNull();
  });
});
