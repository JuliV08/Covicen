import { describe, expect, it } from 'vitest';
import { variantesHero } from '@/lib/atmosfera';

describe('variantesHero', () => {
  it('sin foto nocturna no hay fotos (cae al vector)', () => {
    expect(variantesHero(false, true)).toEqual([]);
  });
  it('solo nocturna: una sola foto, visible en los dos temas y con prioridad', () => {
    expect(variantesHero(true, false)).toEqual([{ nombre: 'hero-ruta-nocturna', clase: '', prioridad: true }]);
  });
  it('con foto de día: una por tema; la del tema por defecto carga primero', () => {
    expect(variantesHero(true, true, 'oscuro')).toEqual([
      { nombre: 'hero-ruta-nocturna', clase: 'solo-oscuro', prioridad: true },
      { nombre: 'hero-ruta-diurna', clase: 'solo-claro', prioridad: false },
    ]);
    expect(variantesHero(true, true, 'claro').find((v) => v.nombre === 'hero-ruta-diurna')?.prioridad).toBe(true);
    expect(variantesHero(true, true, 'sistema').find((v) => v.nombre === 'hero-ruta-nocturna')?.prioridad).toBe(true);
  });
});
