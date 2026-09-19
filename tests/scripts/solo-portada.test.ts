import { describe, expect, it } from 'vitest';
import { alcanzables, referenciasAstro } from '../../scripts/lib/solo-portada.ts';

// La poda que deja el build en una sola página borra de _astro/ todo lo que la portada no usa. Si el barrido se
// quedara corto, el deploy se llevaría las fotos y el JS de las 29 páginas que no se publican; si se pasara de
// largo, la portada quedaría sin su CSS o sin su tipografía. Lo segundo es lo grave, y es lo que mide el cierre
// transitivo: el HTML nombra el CSS, y el CSS —no el HTML— nombra las fuentes y las fotos.
describe('referenciasAstro', () => {
  it('saca los nombres de archivo de _astro, con o sin barra inicial', () => {
    const html = '<link href="/_astro/index.CzQXI53W.css"><script src="_astro/tema.ABC123.js"></script>';
    expect(referenciasAstro(html)).toEqual(['index.CzQXI53W.css', 'tema.ABC123.js']);
  });

  it('no confunde la palabra suelta ni las rutas de otro lado', () => {
    expect(referenciasAstro('hablamos de _astro en prosa y de /assets/foto.avif')).toEqual([]);
  });
});

describe('alcanzables', () => {
  it('sigue el rastro del CSS hasta las fuentes y las fotos que el HTML no nombra', () => {
    const html = '<link href="/_astro/portada.AAA.css"><img src="/_astro/hero.BBB.avif">';
    const css = '@font-face{src:url(/_astro/archivo.CCC.woff2)}.x{background:url(/_astro/grano.DDD.png)}';
    const usados = alcanzables([html], (a) => (a === 'portada.AAA.css' ? css : undefined));
    expect([...usados].sort()).toEqual(['archivo.CCC.woff2', 'grano.DDD.png', 'hero.BBB.avif', 'portada.AAA.css']);
  });

  it('no deja afuera nada que se alcance, ni entra en bucle si dos hojas se citan entre sí', () => {
    const hojas: Record<string, string> = {
      'a.AAA.css': '@import "/_astro/b.BBB.css"; .x{background:url(/_astro/foto.EEE.avif)}',
      'b.BBB.css': '@import "/_astro/a.AAA.css";',
    };
    const usados = alcanzables(['<link href="/_astro/a.AAA.css">'], (a) => hojas[a]);
    expect([...usados].sort()).toEqual(['a.AAA.css', 'b.BBB.css', 'foto.EEE.avif']);
  });

  it('lo que no aparece en ningún lado no se alcanza (y por eso se borra)', () => {
    const usados = alcanzables(['<link href="/_astro/portada.AAA.css">'], () => '');
    expect(usados.has('mapa-interactivo.ZZZ.js')).toBe(false);
  });
});
