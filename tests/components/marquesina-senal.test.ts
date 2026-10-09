import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Marquesina from '@/components/Marquesina.astro';

// La cinta rediseñada «señal de ruta» (05/10/2026, fase B): pestaña azul con chevrón, como las señales informativas de
// las rutas argentinas (Corresur usa un bloque amarillo); la pestaña es el freno, sin botón aparte a la derecha.
const avisos = [
  { id: 'a', texto: 'Consultá el cuadro tarifario vigente.', tono: 'info', url: '/tarifas' },
  { id: 'b', texto: 'Emergencias en la ruta: llamá al 140.', tono: 'vial' },
];
const render = async () => (await AstroContainer.create()).renderToString(Marquesina as never, { props: { avisos } });
const fuente = readFileSync('src/components/Marquesina.astro', 'utf8');

describe('la cinta «señal de ruta»', () => {
  it('la pestaña lleva el freno adentro y el rótulo; no hay otro botón', async () => {
    const html = await render();
    const pestana = /<div class="marquesina-etiqueta[^"]*"[^>]*>[\s\S]*?<\/div>/.exec(html)?.[0] ?? '';
    expect(pestana).toMatch(/<button[^>]*data-pausa/);
    expect(pestana).toContain('Avisos');
    expect(html.match(/<button/g)?.length).toBe(1);
  });
  it('el punto va solo en los avisos de emergencia', async () => {
    const html = await render();
    expect(html.match(/class="marquesina-punto/g)?.length).toBe(2); // uno por copia de la pista
  });
  it('la pestaña es azul de marca con texto blanco y punta de chevrón; nada de amarillo', () => {
    const etiqueta = /\.marquesina-etiqueta \{([^}]*)\}/.exec(fuente)?.[1] ?? '';
    expect(etiqueta).toContain('background: var(--color-marca-700)');
    expect(etiqueta).toContain('color: var(--color-sobre-marca)');
    expect(etiqueta).toContain('clip-path: polygon(');
    expect(etiqueta).not.toContain('--color-vial');
  });
  // 05/10/2026, Juli: «a la hora de despausar, se despausa hasta que saco el mouse […] estoy obligado a dejar el mouse
  // puesto en el botón de AVISOS o a refrescar». El clic deja el foco en la pestaña; con `:focus-within` la cinta
  // quedaba frenada para siempre al salir con el mouse. El foco frena solo si es de teclado (`:focus-visible`).
  it('un clic con el mouse no deja la cinta frenada: el foco frena solo si es de teclado', () => {
    expect(fuente).toMatch(/\.marquesina:has\(:focus-visible\) \.marquesina-cinta/);
    expect(fuente).not.toMatch(/\.marquesina:focus-within \.marquesina-cinta/);
  });
  it('el texto se desvanece en los dos bordes y los avisos se separan con marcas de carril', () => {
    expect(/\.marquesina-pista \{([^}]*)\}/.exec(fuente)?.[1]).toMatch(/mask-image: linear-gradient\(90deg, transparent/);
    expect(fuente).toMatch(/\.marquesina-item::before \{[^}]*repeating-linear-gradient/);
    expect(fuente).not.toMatch(/\.marquesina-item \+ \.marquesina-item \{[^}]*border-inline-start/);
  });
});
