import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { esIndexable, esProduccion } from '@/lib/indexacion';

// 06/10/2026, lanzamiento: Google indexa el sitio entero en el dominio oficial y nada más.
describe('esIndexable', () => {
  it('el sitio entero en el dominio oficial se indexa, con y sin www', () => {
    expect(esIndexable({ sitioCompleto: true, sitio: 'https://www.covicen.com.ar' })).toBe(true);
    expect(esIndexable({ sitioCompleto: true, sitio: 'https://covicen.com.ar' })).toBe(true);
  });
  it('la portada de «Próximamente» no se indexa nunca, ni en el dominio oficial', () => {
    expect(esIndexable({ sitioCompleto: false, sitio: 'https://www.covicen.com.ar' })).toBe(false);
  });
  it('Pages, la rama de revisión, la máquina de uno y los dominios parecidos no se indexan', () => {
    for (const sitio of ['https://julIv08.github.io', 'https://dev.d1abc.amplifyapp.com', 'http://localhost:4321', 'https://covicen.com.ar.ejemplo.com', 'https://otracovicen.com.ar', '']) {
      expect(esIndexable({ sitioCompleto: true, sitio }), sitio).toBe(false);
    }
  });
  it('PUBLIC_NO_INDEXAR=true la apaga en una emergencia', () => {
    expect(esIndexable({ sitioCompleto: true, sitio: 'https://www.covicen.com.ar', noIndexar: 'true' })).toBe(false);
  });
  // Si el sitio y el control del build decidieran distinto, el build fallaría y no se publicaría nada.
  it('el sitio y verificar.ts usan la misma regla', () => {
    expect(readFileSync('src/lib/config.ts', 'utf8')).toMatch(/indexable: esIndexable\(\{ sitioCompleto, sitio, noIndexar: import\.meta\.env\.PUBLIC_NO_INDEXAR \}\)/);
    expect(readFileSync('scripts/verificar.ts', 'utf8')).toMatch(/const indexable = esIndexable\(\{ sitioCompleto, sitio: env\.PUBLIC_SITE_URL \?\? '', noIndexar: env\.PUBLIC_NO_INDEXAR \}\);/);
  });
});

// 14/10/2026: Google Analytics cuenta solo el sitio publicado en el dominio oficial. En Pages, la rama de revisión o la
// máquina de uno no se carga: las visitas del equipo se mezclarían con las del público.
describe('esProduccion', () => {
  it('el sitio entero en el dominio oficial, con y sin www', () => {
    expect(esProduccion({ sitioCompleto: true, sitio: 'https://www.covicen.com.ar' })).toBe(true);
    expect(esProduccion({ sitioCompleto: true, sitio: 'https://covicen.com.ar' })).toBe(true);
  });
  it('no la portada, ni Pages, ni la rama de revisión, ni la máquina de uno', () => {
    expect(esProduccion({ sitioCompleto: false, sitio: 'https://www.covicen.com.ar' })).toBe(false);
    for (const sitio of ['https://juliv08.github.io', 'https://dev.d1abc.amplifyapp.com', 'http://localhost:4321', 'https://covicen.com.ar.ejemplo.com', '']) {
      expect(esProduccion({ sitioCompleto: true, sitio }), sitio).toBe(false);
    }
  });
  it('el sitio y verificar.ts usan la misma regla', () => {
    expect(readFileSync('src/lib/config.ts', 'utf8')).toMatch(/enProduccion: esProduccion\(\{ sitioCompleto, sitio \}\)/);
    expect(readFileSync('scripts/verificar.ts', 'utf8')).toMatch(/const enProduccion = esProduccion\(\{ sitioCompleto, sitio: env\.PUBLIC_SITE_URL \?\? '' \}\);/);
  });
});
