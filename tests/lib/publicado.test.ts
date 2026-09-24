import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { publicado } from '@/lib/publicado';

// El valor de este módulo NO es lo que dice hoy: es que sea el ÚNICO lugar donde se dice. Si mañana alguien esconde
// una sección con un `if (false)` suelto en una página, el dato que falta deja de estar en la lista que Juli le lleva
// al gerente y nadie se entera. Por eso el test mira las dos cosas: que estén todas las claves y que el archivo siga
// siendo una lista de literales que se lee de un vistazo.
const sinComentarios = (ts: string) => ts.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('publicado', () => {
  it('declara las secciones que esperan confirmación del área', () => {
    for (const clave of [
      'obras', 'descuentosPorFrecuencia', 'tarifaDiferencial', 'pasasteSinPagar',
      'excesoDeCarga', 'categoriasFuturas', 'tramiteVecinosFrentistas', 'serviciosDeAreaDescanso',
      'formularioTelepase',
    ] as const) {
      expect(publicado, `falta la clave ${clave}`).toHaveProperty(clave);
      expect(typeof publicado[clave], `${clave} tiene que ser booleano`).toBe('boolean');
    }
  });

  it('todas las claves son booleanas y nada más', () => {
    for (const [k, v] of Object.entries(publicado)) expect(typeof v, k).toBe('boolean');
  });

  it('el objeto está congelado: prenderlo en runtime no es una opción', () => {
    expect(Object.isFrozen(publicado)).toBe(true);
  });

  // Volver a mostrar una sección tiene que ser cambiar un false por un true. Si el módulo leyera variables de entorno
  // o hiciera cuentas, dejaría de ser un interruptor y pasaría a ser un lugar donde hay que entender algo antes de
  // tocarlo: exactamente lo que este archivo viene a evitar para el que carga los datos.
  it('el módulo son literales: ni entorno, ni lógica, ni imports', () => {
    const codigo = sinComentarios(readFileSync('src/lib/publicado.ts', 'utf8'));
    expect(codigo, 'lee el entorno').not.toMatch(/import\.meta\.env|process\.env/);
    expect(codigo, 'importa algo').not.toMatch(/^\s*import\s/m);
    expect(codigo, 'tiene lógica').not.toMatch(/\?|&&|\|\||=>|\bif\b/);
  });
});
