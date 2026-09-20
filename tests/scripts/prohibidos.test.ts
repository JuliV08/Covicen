import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// No se puede importar verificar.ts (corre al importarse y lee dist/). Lo que hay que fijar acá es el CONTRATO de la
// guarda, no su implementación: que las dos formas de nombrar el pliego estén prohibidas y que la excepción sea
// exactamente /transparencia/ y ninguna otra. Si alguien la afloja para que le pase su página, este test lo dice.
//
// Pedido del gerente (call del 20/09/2026): «hace mención del pliego; esas cosas que no aparezcan». La excepción es
// /transparencia/, donde la normativa ES el contenido y citarla es justamente lo institucional.
const fuente = readFileSync('scripts/verificar.ts', 'utf8');
// El corchete de cierre se busca al final de la línea, no el primero que aparezca: los propios patrones traen uno
// adentro (`[GP]`) y un `[^\]]*` cortaba la captura en la mitad de la expresión regular.
const lista = /const PROHIBIDOS_USUARIO = (\[.*\]);/.exec(fuente)?.[1] ?? '';
// eslint-disable-next-line no-eval -- son literales de expresión regular leídos del propio repo, no entrada externa
const patrones: RegExp[] = lista ? (eval(lista) as RegExp[]) : [];

describe('prohibidos del pliego en la cara del público', () => {
  it('la lista existe y agarra las dos formas de nombrarlo', () => {
    expect(patrones.length, 'falta PROHIBIDOS_USUARIO en scripts/verificar.ts').toBeGreaterThan(0);
    for (const texto of ['(PETG art. 52)', 'PETP art. 3', 'según el pliego', 'Pliego de Especificaciones Técnicas', 'los pliegos']) {
      expect(patrones.some((p) => p.test(texto)), `se le escapa "${texto}"`).toBe(true);
    }
  });

  it('no agarra cosas que no son citas', () => {
    for (const texto of ['plegado', 'Resolución 248/2026', 'el contrato de concesión lo exige', 'competencia']) {
      expect(patrones.some((p) => p.test(texto)), `falso positivo con "${texto}"`).toBe(false);
    }
  });

  it('la única página exceptuada es transparencia', () => {
    const excepcion = /const SIN_PLIEGO = [^;]+;/.exec(fuente)?.[0] ?? '';
    expect(excepcion).toContain("startsWith('transparencia')");
    expect(excepcion.match(/startsWith/g)?.length, 'hay más de una página exceptuada').toBe(1);
  });

  it('la guarda se aplica dentro del bucle de páginas', () => {
    expect(fuente).toMatch(/SIN_PLIEGO\(nombre\)[\s\S]{0,140}PROHIBIDOS_USUARIO/);
  });

  // La `fuente` de cada dato se dejó de PINTAR, no se borró: es la trazabilidad de por qué la web dice lo que dice,
  // y el día que alguien pregunte «¿de dónde sacaron que la grúa es gratis?» tiene que estar la respuesta.
  it('el dato de la fuente sigue en el contenido, aunque no se muestre', () => {
    expect(readFileSync('src/content/servicios.json', 'utf8')).toContain('PETG');
    expect(readFileSync('src/content/contacto.json', 'utf8')).toContain('PETG');
  });
});
