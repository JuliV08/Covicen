import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { config } from '@/lib/config';

describe('config', () => {
  it('lee las variables públicas del entorno', () => {
    expect(config.sitio).toBe('https://covicen.test');
    expect(config.base).toBe('/');
    expect(config.indexable).toBe(false);
    expect(config.fuenteDatos).toBe('local');
  });

  // El default invertido es una decisión de seguridad, no una preferencia: hoy el sitio lo sube una persona que
  // corre `pnpm build` sin configurar nada, y ese build tiene que salir «Próximamente». Si alguien da vuelta este
  // default, lo que se publica de más son las 30 páginas del sitio antes de tiempo.
  it('sin PUBLIC_SITIO_COMPLETO no se publica el sitio entero', () => {
    expect(config.sitioCompleto).toBe(false);
    // El valor de arriba sale del entorno que fija vitest.config.ts. El default de verdad —lo que pasa cuando la
    // variable NO existe, que es el caso de quien publica hoy— vive en el código y se comprueba ahí: Vite inlinea
    // `import.meta.env` en build, así que no hay forma honesta de simular su ausencia desde un test.
    const fuente = readFileSync('src/lib/config.ts', 'utf8');
    expect(fuente).toMatch(/const sitioCompleto = oDefecto\(import\.meta\.env\.PUBLIC_SITIO_COMPLETO, 'false'\) === 'true';/);
    // Y que `indexable` siga dependiendo de él: una portada de «Próximamente» no se indexa ni con dominio.
    expect(fuente).toMatch(/indexable: oDefecto\(import\.meta\.env\.PUBLIC_INDEXABLE, 'false'\) === 'true' && sitioCompleto,/);
  });
});
