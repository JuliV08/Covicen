import { describe, expect, it } from 'vitest';
import { textoUbicacion } from '@/lib/asistencia';

describe('textoUbicacion', () => {
  it('coordenadas con 5 decimales, precisión redondeada y link a Google Maps', () => {
    expect(textoUbicacion(-32.715012, -61.155087, 24.6)).toBe('-32.71501, -61.15509 (±25 m) · https://maps.google.com/?q=-32.71501,-61.15509');
  });
  it('sin precisión no la muestra', () => {
    expect(textoUbicacion(-31.5, -60.7)).toBe('-31.50000, -60.70000 · https://maps.google.com/?q=-31.50000,-60.70000');
  });
});
