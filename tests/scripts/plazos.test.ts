import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// La guarda de plazos de respuesta de scripts/verificar.ts (02/10/2026: «bajarle el compromiso de los días de
// respuesta»; Juli eligió sacarlos de todos lados). No se puede importar verificar.ts (corre al importarse y lee dist/):
// se leen los patrones de la fuente, como en prohibidos.test.ts. Un falso positivo acá tira el build entero, así que
// importa tanto lo que agarra como lo que deja pasar.
const fuente = readFileSync('scripts/verificar.ts', 'utf8');
const lista = /const PLAZOS_DE_RESPUESTA = (\[.*\]);/.exec(fuente)?.[1] ?? '';
// eslint-disable-next-line no-eval -- son literales de expresión regular leídos del propio repo, no entrada externa
const patrones: RegExp[] = lista ? (eval(lista) as RegExp[]) : [];
const agarra = (t: string) => patrones.some((p) => p.test(t));

describe('plazos de respuesta en la cara del público', () => {
  it('agarra las formas en que la web los prometía', () => {
    expect(patrones.length, 'falta PLAZOS_DE_RESPUESTA en scripts/verificar.ts').toBeGreaterThan(0);
    for (const texto of [
      'Acuse en 24 horas · Respuesta en 5 días hábiles',
      'Recibís un acuse con número de gestión en 24 horas y una respuesta en 5 días hábiles',
      'el 0800 te confirma en el momento',
      'Dentro de las 24 horas te confirmamos que lo recibimos',
      'La respuesta, en 5 días hábiles.',
      'el acuse llega en 24 horas',
      'te respondemos en 10 días hábiles',
    ]) expect(agarra(texto), `se le escapa «${texto}»`).toBe(true);
  });
  it('deja pasar disponibilidades y plazos que no son de respuesta', () => {
    for (const texto of [
      'Siempre disponible; se gestiona en días hábiles',
      'Al menos 8 horas en días hábiles, entre las 8 y las 20',
      'Las 24 horas, los 365 días del año.',
      'La resolución entra en vigencia a los 10 días hábiles.',
      'Si te falta el TelePASE, tenés 90 días para colocarlo.',
      'Te confirmamos que lo recibimos, con un número para seguirlo.',
      'Con fundamento, por el mismo medio por el que nos escribiste.',
      // «corresponde» contiene «respond»: sin el borde de palabra, el patrón tiraba el build (lo vio la revisión).
      'La tarifa que corresponde se cobra a los 30 días.',
      'El beneficio correspondiente dura 90 días.',
    ]) expect(agarra(texto), `falso positivo con «${texto}»`).toBe(false);
  });
  it('se aplica al HTML crudo, al texto visible y a los json/xml', () => {
    expect(fuente).toMatch(/PLAZOS_DE_RESPUESTA\) if \(p\.test\(html\) \|\| p\.test\(plano\) \|\| p\.test\(planoLlano\)\)/);
    expect(fuente).toContain('[...PROHIBIDOS, ...PLAZOS_DE_RESPUESTA]');
  });
});
