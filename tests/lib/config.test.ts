import { describe, expect, it } from 'vitest';
import { config } from '@/lib/config';

describe('config', () => {
  it('lee las variables públicas del entorno', () => {
    expect(config.sitio).toBe('https://covicen.test');
    expect(config.base).toBe('/');
    expect(config.indexable).toBe(false);
    expect(config.fuenteDatos).toBe('local');
  });
});
