import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { disolver, ENTRADA_VELO, SALIDA_VELO } from '@/lib/disolvencia';

const css = readFileSync('src/styles/global.css', 'utf8');

/** Doble del velo: anota el orden de lo que pasa y corre los diferidos a la altura que uno le pida. */
const doble = () => {
  const pasos: string[] = [];
  const relojes: Array<{ ms: number; fn: () => void }> = [];
  const velo = {
    mostrar: () => { pasos.push('mostrar'); },
    ocultar: () => { pasos.push('soltar'); },
    esperar: (ms: number, fn: () => void) => { relojes.push({ ms, fn }); },
  };
  /** Corre los relojes vencidos a los `ms` indicados, en orden. */
  const correr = (ms: number) => {
    for (let i = 0; i < relojes.length; i++) {
      const r = relojes[i]!;
      if (r.ms <= ms) { relojes.splice(i--, 1); r.fn(); }
    }
  };
  return { pasos, velo, correr };
};

describe('disolvencia del hero al cambiar de tema', () => {
  it('sin velo (o con "menos movimiento") el tema cambia de una, sin esperar nada', () => {
    const pasos: string[] = [];
    disolver(() => pasos.push('cambiar'), null);
    expect(pasos).toEqual(['cambiar']);
  });

  it('primero tapa, y el tema recién cambia cuando el velo tapó del todo', () => {
    const { pasos, velo, correr } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    // Antes de que venza nada, el tema NO cambió: si cambiara acá se vería el corte entre las dos fotos.
    expect(pasos).toEqual(['mostrar']);
    correr(ENTRADA_VELO - 1);
    expect(pasos).toEqual(['mostrar']);
    correr(ENTRADA_VELO);
    expect(pasos).toEqual(['mostrar', 'cambiar']);
  });

  it('el cerrojo se suelta recién cuando termina la animación', () => {
    const { pasos, velo, correr } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    correr(ENTRADA_VELO);
    expect(pasos).not.toContain('soltar');
    correr(SALIDA_VELO);
    expect(pasos).toEqual(['mostrar', 'cambiar', 'soltar']);
  });

  it('el tema se aplica una sola vez', () => {
    const { pasos, velo, correr } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    correr(SALIDA_VELO);
    expect(pasos.filter((p) => p === 'cambiar')).toHaveLength(1);
  });

  // La razón de ser de todo esto: el velo tapa el hero ENTERO, texto incluido. Si se quedara arriba, el usuario ve un
  // panel liso donde va la foto — que es exactamente el bug que reportó Juli. Por eso bajarlo NO puede depender del
  // JS: lo hace la animación de CSS sola, de 0 a 1 y de vuelta a 0.
  it('la animación de CSS empieza y termina transparente: el JS no la puede dejar tapando', () => {
    const fotogramas = /@keyframes velo-tema\s*\{([\s\S]*?)\n\s*\}/.exec(css)?.[1] ?? '';
    expect(fotogramas, 'no encontré @keyframes velo-tema').not.toBe('');
    expect(fotogramas).toMatch(/0%\s*\{\s*opacity:\s*0/);
    expect(fotogramas).toMatch(/100%\s*\{\s*opacity:\s*0/);
  });

  it('el momento de cambiar el tema es el fotograma en que el velo tapa del todo', () => {
    const dur = /\.velo-tema\[data-visible\]\s*\{\s*animation:\s*velo-tema\s+(\d+)ms/.exec(css)?.[1];
    const pico = /@keyframes velo-tema\s*\{[\s\S]*?(\d+)%\s*\{\s*opacity:\s*1/.exec(css)?.[1];
    expect(dur, 'no encontré la animación de .velo-tema').toBeDefined();
    expect(pico, 'no encontré el fotograma en que el velo tapa del todo').toBeDefined();
    expect(Number(dur)).toBe(SALIDA_VELO);
    expect(Math.round((Number(dur) * Number(pico)) / 100)).toBe(ENTRADA_VELO);
  });

  it('el velo no captura el puntero ni se queda pintado sin la marca', () => {
    expect(css).toMatch(/\.velo-tema\s*\{[^}]*pointer-events:\s*none/);
    expect(css).toMatch(/\.velo-tema\s*\{[^}]*opacity:\s*0/);
  });
});
