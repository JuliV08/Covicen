import { describe, expect, it } from 'vitest';
import { disolver, ENTRADA_VELO } from '@/lib/disolvencia';

/** Doble del velo: anota el orden en que pasan las cosas y corre los diferidos a mano. */
const doble = () => {
  const pasos: string[] = [];
  const pendientes: Array<() => void> = [];
  const velo = {
    mostrar: () => { pasos.push('mostrar'); },
    ocultar: () => { pasos.push('ocultar'); },
    esperar: (ms: number, fn: () => void) => { pasos.push(`esperar:${ms}`); pendientes.push(fn); },
    frame: (fn: () => void) => { pasos.push('frame'); pendientes.push(fn); },
  };
  const correrTodo = () => { while (pendientes.length) pendientes.shift()!(); };
  return { pasos, velo, correrTodo };
};

describe('disolvencia del hero al cambiar de tema', () => {
  it('sin velo (o con "menos movimiento") el tema cambia de una, sin esperar nada', () => {
    const pasos: string[] = [];
    disolver(() => pasos.push('cambiar'), null);
    expect(pasos).toEqual(['cambiar']);
  });

  it('con velo: primero tapa, después cambia el tema, y recién al final destapa', () => {
    const { pasos, velo, correrTodo } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    // Antes de que corran los diferidos, el tema NO cambió: si cambiara acá se vería el corte entre las dos fotos.
    expect(pasos).toEqual(['mostrar', `esperar:${ENTRADA_VELO}`]);
    correrTodo();
    expect(pasos).toEqual(['mostrar', `esperar:${ENTRADA_VELO}`, 'cambiar', 'frame', 'frame', 'ocultar']);
    expect(pasos.indexOf('mostrar')).toBeLessThan(pasos.indexOf('cambiar'));
    expect(pasos.indexOf('cambiar')).toBeLessThan(pasos.indexOf('ocultar'));
  });

  it('el tema se aplica una sola vez', () => {
    const { pasos, velo, correrTodo } = doble();
    disolver(() => pasos.push('cambiar'), velo);
    correrTodo();
    expect(pasos.filter((p) => p === 'cambiar')).toHaveLength(1);
  });

  it('la espera coincide con la transición de .velo-tema en global.css', async () => {
    const css = await import('node:fs').then((fs) => fs.readFileSync('src/styles/global.css', 'utf8'));
    const ms = /\.velo-tema\s*\{[^}]*transition:\s*opacity\s+(\d+)ms/.exec(css)?.[1];
    expect(ms, 'no encontré la transición de .velo-tema').toBeDefined();
    expect(Number(ms)).toBe(ENTRADA_VELO);
  });
});
