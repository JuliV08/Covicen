import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { enlacesInstitucionales, logoInstitucional, proporcionSvg } from '@/lib/institucional';

const carpeta = 'src/assets/institucional';

describe('logos institucionales', () => {
  it('proporcionSvg lee el viewBox y no inventa una proporción si no hay', () => {
    expect(proporcionSvg('<svg viewBox="0 0 200 100"></svg>')).toBe(2);
    expect(proporcionSvg('<svg viewBox="25.25 18.25 105.05 54.35"></svg>')).toBeCloseTo(1.933, 3);
    expect(proporcionSvg('<svg width="10" height="10"></svg>')).toBeUndefined();
    expect(proporcionSvg('<svg viewBox="0 0 0 10"></svg>')).toBeUndefined();
  });

  // Los cuatro sitios del pie tienen su logo oficial en la carpeta: si falta uno, el pie lo mostraría en texto sin que
  // nadie lo note. Las proporciones son las de los archivos del 25/09/2026 (escudos apaisados, Vialidad vertical,
  // TelePASE de un renglón).
  it('cada sitio del pie tiene su logo, con la proporción de su archivo', () => {
    const esperadas = { presidencia: 1.933, transporte: 2.136, 'vialidad-nacional': 0.839, telepase: 6 };
    for (const e of enlacesInstitucionales) {
      const logo = logoInstitucional(e.id);
      expect(logo, `falta el logo de ${e.nombre}`).toBeDefined();
      expect(logo!.url, e.id).toMatch(/\.(svg|png)/);
      expect(logo!.proporcion, e.id).toBeCloseTo(esperadas[e.id], 2);
    }
  });

  // El pie los pinta como máscara (toma la forma, no el color). Un relleno blanco o una transparencia parcial saldrían
  // como mancha: cada SVG tiene que ser de un solo color, sin blanco ni opacidades, y con viewBox.
  it('los SVG sirven como máscara: un solo color, sin blanco ni opacidad, con viewBox', () => {
    for (const archivo of readdirSync(carpeta).filter((f) => f.endsWith('.svg'))) {
      const svg = readFileSync(`${carpeta}/${archivo}`, 'utf8');
      expect(proporcionSvg(svg), `${archivo} sin viewBox`).toBeDefined();
      const colores = new Set([...svg.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]!.toLowerCase()).filter((c) => c !== 'none'));
      expect(colores.size, `${archivo}: ${[...colores].join(', ')}`).toBeLessThanOrEqual(1);
      expect([...colores].some((c) => /^#f{3}(f{3})?$|^white$/.test(c)), `${archivo} tiene blanco`).toBe(false);
      expect(svg, `${archivo} tiene opacidades`).not.toMatch(/opacity/);
    }
  });
});
