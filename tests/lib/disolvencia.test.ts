import { describe, expect, it } from 'vitest';
import { disolver, ENTRADA_VELO, TOPE_VELO } from '@/lib/disolvencia';

/** Doble del velo. Separa los diferidos por reloj de los diferidos por frame, porque lo que hay que poder probar es
 *  justamente qué pasa cuando los frames NO llegan (pestaña en segundo plano): ahí el navegador sigue disparando
 *  setTimeout pero no requestAnimationFrame. */
const doble = () => {
  const pasos: string[] = [];
  const relojes: Array<{ ms: number; fn: () => void }> = [];
  const frames: Array<() => void> = [];
  const velo = {
    mostrar: () => { pasos.push('mostrar'); },
    ocultar: () => { pasos.push('ocultar'); },
    esperar: (ms: number, fn: () => void) => { pasos.push(`esperar:${ms}`); relojes.push({ ms, fn }); },
    frame: (fn: () => void) => { pasos.push('frame'); frames.push(fn); },
  };
  /** Corre los relojes vencidos a los `ms` indicados, en orden. */
  const correrRelojes = (ms: number) => {
    for (let i = 0; i < relojes.length; i++) {
      const r = relojes[i]!;
      if (r.ms <= ms) { relojes.splice(i--, 1); r.fn(); }
    }
  };
  /** Drena los frames pendientes, incluidos los que se encadenan. */
  const correrFrames = () => { while (frames.length) frames.shift()!(); };
  return { pasos, velo, correrRelojes, correrFrames };
};

describe('disolvencia del hero al cambiar de tema', () => {
  it('sin velo (o con "menos movimiento") el tema cambia de una, sin esperar nada', () => {
    const pasos: string[] = [];
    disolver(() => pasos.push('cambiar'), null);
    expect(pasos).toEqual(['cambiar']);
  });

  it('con velo: primero tapa, después cambia el tema, y recién al final destapa', () => {
    const { pasos, velo, correrRelojes, correrFrames } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    // Antes de que venza nada, el tema NO cambió: si cambiara acá se vería el corte entre las dos fotos.
    expect(pasos).toEqual(['mostrar', `esperar:${ENTRADA_VELO}`, `esperar:${TOPE_VELO}`]);
    correrRelojes(ENTRADA_VELO);
    expect(pasos).toContain('cambiar');
    // Con el tema recién aplicado el velo sigue arriba: falta que el navegador pinte la foto nueva debajo.
    expect(pasos).not.toContain('ocultar');
    correrFrames();
    expect(pasos).toContain('ocultar');
    expect(pasos.indexOf('mostrar')).toBeLessThan(pasos.indexOf('cambiar'));
    expect(pasos.indexOf('cambiar')).toBeLessThan(pasos.indexOf('ocultar'));
  });

  it('el tema se aplica una sola vez', () => {
    const { pasos, velo, correrRelojes, correrFrames } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    correrRelojes(TOPE_VELO);
    correrFrames();
    expect(pasos.filter((p) => p === 'cambiar')).toHaveLength(1);
  });

  // La razón de ser del tope: sin él, una pestaña que se va a segundo plano dejaba el velo tapando el hero para
  // siempre (un panel liso donde va la foto) y la disolvencia no volvía a andar en toda la visita.
  it('si los frames nunca llegan, el velo baja igual por el tope', () => {
    const { pasos, velo, correrRelojes } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    correrRelojes(ENTRADA_VELO);
    expect(pasos).not.toContain('ocultar');
    correrRelojes(TOPE_VELO);
    expect(pasos.filter((p) => p === 'ocultar')).toHaveLength(1);
  });

  it('con frames y tope juntos, el velo se baja una sola vez', () => {
    const { pasos, velo, correrRelojes, correrFrames } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    correrRelojes(ENTRADA_VELO);
    correrFrames();
    correrRelojes(TOPE_VELO);
    correrFrames();
    expect(pasos.filter((p) => p === 'ocultar')).toHaveLength(1);
  });

  it('el tope le da margen de sobra a la entrada del velo', () => {
    expect(TOPE_VELO).toBeGreaterThan(ENTRADA_VELO * 2);
  });

  it('la espera coincide con la transición de .velo-tema en global.css', async () => {
    const css = await import('node:fs').then((fs) => fs.readFileSync('src/styles/global.css', 'utf8'));
    const ms = /\.velo-tema\s*\{[^}]*transition:\s*opacity\s+(\d+)ms/.exec(css)?.[1];
    expect(ms, 'no encontré la transición de .velo-tema').toBeDefined();
    expect(Number(ms)).toBe(ENTRADA_VELO);
  });
});
