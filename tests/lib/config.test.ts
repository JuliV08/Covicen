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

  // Hasta el lanzamiento el default iba al revés (sin la variable, «Próximamente»): olvidarse publicaba de menos, que
  // antes de salir era lo seguro. 06/10/2026, lanzamiento: el default se dio vuelta. Sin la variable sale el sitio entero; la portada, solo con
  // PUBLIC_SITIO_COMPLETO=false (es lo que fija vitest.config.ts para estos tests y verificar-portada.ts para su build).
  it('sin PUBLIC_SITIO_COMPLETO se publica el sitio entero, y los tres lugares que lo deciden dicen lo mismo', () => {
    expect(config.sitioCompleto).toBe(false);
    // El valor de arriba sale del entorno que fija vitest.config.ts. El default de verdad —lo que pasa cuando la
    // variable NO existe, que es el caso de quien publica hoy— vive en el código y se comprueba ahí: Vite inlinea
    // `import.meta.env` en build, así que no hay forma honesta de simular su ausencia desde un test.
    const fuente = readFileSync('src/lib/config.ts', 'utf8');
    expect(fuente).toMatch(/const sitioCompleto = oDefecto\(import\.meta\.env\.PUBLIC_SITIO_COMPLETO, 'true'\) === 'true';/);
    // astro.config.mjs (qué páginas se arman) y verificar.ts (qué se controla) tienen que leerla igual: si no, Amplify
    // arma una cosa, controla otra y no publica nada.
    for (const archivo of ['astro.config.mjs', 'scripts/verificar.ts']) {
      expect(readFileSync(archivo, 'utf8'), archivo).toContain("const sitioCompleto = (env.PUBLIC_SITIO_COMPLETO ?? '') === '' || env.PUBLIC_SITIO_COMPLETO === 'true';");
    }
    // Y que `indexable` siga dependiendo de él: una portada de «Próximamente» no se indexa ni con dominio (la regla, en
    // lib/indexacion.ts y su test).
    expect(fuente).toMatch(/indexable: esIndexable\(\{ sitioCompleto, sitio, noIndexar: import\.meta\.env\.PUBLIC_NO_INDEXAR \}\),/);
  });
});
