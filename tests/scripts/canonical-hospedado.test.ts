import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// El build que estuvo publicado en www.covicen.com.ar desde el 18/09/2026 salió con TODAS las etiquetas canonical
// apuntando a http://localhost:4321, porque se compiló sin PUBLIC_SITE_URL. Por eso Google nunca lo indexó.
//
// El chequeo que ya existía no lo agarró, y no fue casualidad: solo miraba el canonical cuando PUBLIC_INDEXABLE
// era true, y ese build tampoco era indexable. O sea que la guarda estaba condicionada justo a lo que fallaba.
//
// La guarda nueva mira otra cosa: si el build corre en un hosting, un canonical a localhost está mal SIEMPRE.
// En la máquina de uno sigue siendo correcto, y por eso no se puede prohibir a secas.
//
// El comportamiento se verificó corriendo verificar.ts de las dos formas (21/09/2026): sin CI da 0 fallos, y con
// CI=true sobre el mismo dist da 27, uno por página. Acá se fija el CABLEADO, que es lo que se puede romper sin
// que nadie lo note: que la guarda siga existiendo y que siga reconociendo los dos entornos de build.
const fuente = readFileSync('scripts/verificar.ts', 'utf8');

describe('canonical en un build hospedado', () => {
  it('existe la guarda y no está condicionada a la indexabilidad', () => {
    const linea = fuente.split('\n').find((l) => l.includes('canonical apunta a localhost en un build hospedado'));
    expect(linea, 'se fue la guarda del canonical en builds hospedados').toBeTruthy();
    expect(linea, 'la guarda volvió a depender de indexable, que es lo que dejó pasar el bug').not.toContain('indexable');
    expect(linea).toContain('hospedado');
  });

  it('reconoce los dos entornos donde se buildea de verdad', () => {
    const def = /const hospedado = [^;]+;/.exec(fuente)?.[0] ?? '';
    expect(def, 'no encontré la definición de `hospedado`').toBeTruthy();
    // CI lo pone GitHub Actions; AWS_APP_ID, el build de Amplify. Si se cambia de hosting, hay que sumar el suyo.
    expect(def).toContain('CI');
    expect(def).toContain('AWS_APP_ID');
  });

  // La compuerta de Amplify es la que hace que todo esto sirva: sin ella, Amplify publica sin correr nada.
  it('amplify.yml corre los mismos chequeos que el CI, y en el orden correcto', () => {
    const spec = readFileSync('amplify.yml', 'utf8');
    for (const comando of ['pnpm check', 'pnpm test', 'pnpm verificar:portada', 'pnpm verificar']) {
      expect(spec.includes(comando), `la compuerta de Amplify no corre ${comando}`).toBe(true);
    }
    // `verificar:portada` ANTES que `verificar`: cada uno deja su propio dist/ y el último es el que se publica.
    expect(spec.indexOf('pnpm verificar:portada')).toBeLessThan(spec.lastIndexOf('pnpm verificar'));
    // Y que el artefacto que sube sea el dist, no otra carpeta.
    expect(spec).toMatch(/baseDirectory:\s*dist/);
  });
});
