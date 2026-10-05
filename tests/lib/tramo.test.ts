import { describe, expect, it } from 'vitest';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { cajaCirculo, cajaTexto, chocan, encuadreDelMapa, estadoCabina, fichaLibre, leyendaServicios, puntoEnRuta, rotulosDelMapa, serviciosDeCabina, TAM_ROTULO } from '@/lib/tramo';

describe('estadoCabina', async () => {
  const t = await fuenteLocalJson.tramo();
  const por = (slug: string) => t.cabinas.find((c) => c.slug === slug)!;
  // Call del 20/09/2026: la etiqueta deja de anunciar la modalidad de cobro de las nuevas, que no está definida.
  it('operativa para las existentes, próxima a secas para las nuevas', () => {
    expect(estadoCabina(por('carcarana'))).toEqual({ clave: 'operativa', etiqueta: 'Operativa' });
    expect(estadoCabina(por('leones'))).toEqual({ clave: 'proxima', etiqueta: 'Próxima' });
  });
  // El dato no se borró: se apagó la UI. Si alguien "limpia" el contrato, el backend empieza a mandar un campo que
  // el schema rechaza y el build se cae con un error que no habla de esto.
  it('el campo freeFlow del contrato sigue llegando aunque no se muestre', () => {
    expect(por('leones').freeFlow).toBe(true);
    expect(estadoCabina(por('leones')).etiqueta).not.toContain('Flow');
  });
  it('servicios: solo los que la estación tiene; la leyenda, solo los que alguna tiene', () => {
    expect(serviciosDeCabina(por('franck')).map((s) => s.clave)).toEqual(['areaDescanso', 'gruaGratuita']);
    expect(serviciosDeCabina(por('totoras'))).toEqual([]);
    expect(leyendaServicios(t).map((s) => s.clave)).toEqual(['areaDescanso', 'gruaGratuita']);
  });
});

describe('puntoEnRuta', async () => {
  const t = await fuenteLocalJson.tramo();
  const ciudad = (slug: string) => t.ciudades.find((c) => c.slug === slug)!.mapa;
  it('en la progresiva inicial devuelve el primer nodo del trazado y en la final el último', () => {
    expect(puntoEnRuta(t, 'RN 9', 297)).toEqual(ciudad('rosario'));
    // El PK final de la RN 9 es el inicio de la Red de Accesos a Córdoba, en Pilar: la concesión NO llega a la capital.
    // Córdoba sigue dibujada como ciudad de referencia (principal), fuera del trazado, igual que Rafaela y Santa Fe.
    expect(puntoEnRuta(t, 'RN 9', 660.16)).toEqual(ciudad('pilar'));
    expect(puntoEnRuta(t, 'RN 34', 188.68)).toEqual(ciudad('empalme-rn-19'));
  });
  it('recorta los km fuera del tramo y cae en el medio del trazo para un km intermedio', () => {
    expect(puntoEnRuta(t, 'RN 34', 999)).toEqual(ciudad('empalme-rn-19'));
    const p = puntoEnRuta(t, 'RN 34', 94)!;
    expect(p.y).toBeLessThan(ciudad('rosario').y);
    expect(p.y).toBeGreaterThan(ciudad('empalme-rn-19').y);
  });
  it('devuelve null si la ruta no tiene progresivas', () => {
    const sinPk = { ...t, rutas: t.rutas.map((r) => ({ ...r, pkInicial: undefined, pkFinal: undefined })) };
    expect(puntoEnRuta(sinPk, 'RN 9', 340)).toBeNull();
  });
});

// 05/10/2026: «en RN19 se tapa por Franck y parecido abajo con el punto, que dice Santa Fe». Las coordenadas de ciudades
// y estaciones no se tocan (contrato con el backend): se mueven solo los rótulos.
describe('rotulosDelMapa', async () => {
  const t = await fuenteLocalJson.tramo();
  const { rutas, ciudades } = rotulosDelMapa(t);
  const cajasRutas = rutas.map((r) => cajaTexto(r, r.ruta, TAM_ROTULO.ruta.tam, TAM_ROTULO.ruta.factor));
  const cajasCiudades = ciudades.map((c) => cajaTexto(c, c.nombre, TAM_ROTULO.ciudad.tam, TAM_ROTULO.ciudad.factor));
  const halos = t.cabinas.map((c) => cajaCirculo(c.mapa.x, c.mapa.y, 19));
  const rotulosCabina = t.cabinas.map((c) => cajaTexto({ x: c.mapa.x, y: c.mapa.y - 18, ancla: 'middle' }, c.nombre.toUpperCase(), TAM_ROTULO.cabina.tam, TAM_ROTULO.cabina.factor));

  it('hay un rótulo por ruta y uno por ciudad principal', () => {
    expect(rutas.map((r) => r.ruta).sort()).toEqual(t.trazados.map((x) => x.ruta).sort());
    expect(ciudades.map((c) => c.slug).sort()).toEqual(t.ciudades.filter((c) => c.principal).map((c) => c.slug).sort());
  });
  it('ningún rótulo de ruta o de ciudad pisa una estación, el rótulo de una estación u otro rótulo', () => {
    const propios = [...cajasRutas, ...cajasCiudades];
    for (const [i, a] of propios.entries()) {
      for (const b of [...halos, ...rotulosCabina]) expect(chocan(a, b), `rótulo ${i}`).toBe(false);
      for (const [j, b] of propios.entries()) if (i !== j) expect(chocan(a, b), `rótulos ${i} y ${j}`).toBe(false);
    }
  });
  it('todos quedan adentro del dibujo (820 × 520)', () => {
    for (const c of [...cajasRutas, ...cajasCiudades]) {
      expect(c.x0).toBeGreaterThanOrEqual(0); expect(c.y0).toBeGreaterThanOrEqual(0);
      expect(c.x1).toBeLessThanOrEqual(820); expect(c.y1).toBeLessThanOrEqual(520);
    }
  });
  it('los dos casos que marcó Juli', () => {
    const franck = t.cabinas.find((c) => c.slug === 'franck')!.mapa;
    const rn19 = rutas.find((r) => r.ruta === 'RN 19')!;
    expect(Math.hypot(rn19.x - franck.x, rn19.y - franck.y)).toBeGreaterThan(80);
    const santaFe = ciudades.find((c) => c.slug === 'santa-fe')!;
    expect(santaFe.ancla).not.toBe('end');
  });
});

// Fase C (05/10/2026): el mapa se encuadra sobre lo dibujado, y la ficha compacta flota en el hueco entre Córdoba y
// San Francisco, por encima de la RN 9.
describe('encuadre y lugar de la ficha', async () => {
  const t = await fuenteLocalJson.tramo();
  it('el encuadre contiene todos los puntos con margen y no se sale del lienzo de 820 × 520', () => {
    const c = encuadreDelMapa(t);
    for (const p of [...t.ciudades.map((x) => x.mapa), ...t.cabinas.map((x) => x.mapa)]) {
      expect(p.x).toBeGreaterThan(c.x + 20);
      expect(p.x).toBeLessThan(c.x + c.ancho - 20);
      expect(p.y).toBeGreaterThan(c.y + 20);
      expect(p.y).toBeLessThan(c.y + c.alto - 20);
    }
    expect(c.x).toBeGreaterThanOrEqual(0);
    expect(c.y).toBeGreaterThanOrEqual(0);
    expect(c.x + c.ancho).toBeLessThanOrEqual(820);
    expect(c.y + c.alto).toBeLessThanOrEqual(520);
  });
  // A 1280 de pantalla el mapa mide 1280 − 40 (contenedor) − 2 × 38,4 (relleno del panel) ≈ 1163 px de ancho; a 1440,
  // 1200 (el contenedor llega a su máximo); a 1024, 984 − 2 × 30,7 ≈ 922.
  it('a 1280 y 1440 px la ficha flotante no tapa rutas, estaciones ni rótulos; a 1024 no entra (va abajo)', () => {
    expect(fichaLibre(t, 1163)).toBe(true);
    expect(fichaLibre(t, 1200)).toBe(true);
    expect(fichaLibre(t, 922)).toBe(false);
  });
});
