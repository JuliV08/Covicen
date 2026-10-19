import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// La configuración de compilación de Amplify. Dos cosas se verifican acá, y las dos costaron un deploy fallido.
//
// 1. QUE CORRA LA COMPUERTA. Amplify no corre los GitHub Actions: tiene su propio pipeline. Sin estos comandos,
//    un merge a `main` publicaría aunque los tests estuvieran en rojo.
//
// 2. QUE EL ARCHIVO SEA YAML VÁLIDO. El 24/09/2026 el primer deploy a producción murió antes de clonar el
//    repositorio, con «The commands provided in the buildspec are malformed». La causa: un comando llevaba dos
//    puntos adentro —un mensaje de `echo` que decía «nvm no disponible: sigo con...»— y en YAML un `: ` significa
//    «acá empieza un valor», así que el archivo dejó de ser válido. Amplify ni siquiera llegó a mirar el código.
//
// No hay parser de YAML en el proyecto (ni vale traerse uno para esto), así que la guarda es puntual: mira
// exactamente lo que AWS pidió en el mensaje de error, que es que todo comando con `:` esté entre comillas.
const spec = readFileSync('amplify.yml', 'utf8');

/** Los comandos de todas las fases, tal como están escritos: las líneas `- …` que cuelgan de un `commands:`. */
const comandos = (() => {
  const salida: string[] = [];
  let dentro = false;
  for (const linea of spec.split('\n')) {
    if (/^\s*commands:\s*$/.test(linea)) { dentro = true; continue; }
    if (!dentro) continue;
    if (/^\s*-\s+/.test(linea)) { salida.push(linea.replace(/^\s*-\s+/, '').trim()); continue; }
    if (/^\s*#/.test(linea) || linea.trim() === '') continue;  // comentarios y líneas en blanco no cortan la lista
    dentro = false;                                            // cualquier otra cosa sí: terminó el bloque
  }
  return salida;
})();

describe('amplify.yml', () => {
  it('se pueden leer los comandos', () => {
    expect(comandos.length, 'no encontré ningún comando en el buildspec').toBeGreaterThan(5);
  });

  it('ningún comando con dos puntos queda sin comillas', () => {
    const rotos = comandos.filter((c) => c.includes(':') && !/^['"]/.test(c));
    expect(rotos, `estos comandos llevan ":" sin comillas y Amplify va a rechazar el archivo entero:\n${rotos.join('\n')}`).toEqual([]);
  });

  it('corre los mismos chequeos que el CI, y en el orden correcto', () => {
    const sinComillas = comandos.map((c) => c.replace(/^['"]|['"]$/g, ''));
    for (const comando of ['pnpm check', 'pnpm test', 'pnpm verificar:portada', 'pnpm verificar']) {
      expect(sinComillas.includes(comando), `la compuerta de Amplify no corre ${comando}`).toBe(true);
    }
    // `verificar:portada` ANTES que `verificar`: cada uno deja su propio dist/ y el último es el que se publica.
    expect(sinComillas.indexOf('pnpm verificar:portada')).toBeLessThan(sinComillas.indexOf('pnpm verificar'));
  });

  it('publica el dist y no otra carpeta', () => {
    expect(spec).toMatch(/baseDirectory:\s*dist/);
  });
});
