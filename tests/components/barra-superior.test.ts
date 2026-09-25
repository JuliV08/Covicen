import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import BarraSuperior from '@/components/BarraSuperior.astro';
import Marquesina from '@/components/Marquesina.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

const render = async () => {
  const c = await AstroContainer.create();
  return c.renderToString(BarraSuperior, { props: { contacto: await fuenteLocalJson.contacto() } });
};
const cinta = async (avisos: unknown[], props: Record<string, unknown> = {}) => {
  const c = await AstroContainer.create();
  return c.renderToString(Marquesina, { props: { avisos, ...props } });
};

describe('BarraSuperior', () => {
  // 25/09/2026: la oficina virtual es la web de autogestión de Telepeaje Plus y el acceso se llama «Autogestión» (hasta
  // el 24/09 fue «Mi cuenta»). Va directo a esa web, en otra pestaña.
  it('accesos: TelePASE externo, Autogestión a Telepeaje Plus y el interruptor', async () => {
    const html = await render();
    expect(html).toMatch(/href="https:\/\/www\.telepase\.com\.ar\/"[^>]*target="_blank"/);
    expect(html).toMatch(/href="https:\/\/www\.telepeajeplus\.com\/Login"[^>]*target="_blank"[^>]*>Autogestión</);
    expect(html).not.toContain('Mi cuenta');
    expect(html).toContain('data-tema-boton');
    // Se cae en el ingreso de otra empresa: el nombre accesible lo dice, y empieza con la palabra visible (WCAG 2.5.3).
    expect(html).toContain('aria-label="Autogestión de Telepeaje Plus (se abre en otra pestaña)"');
  });
  // Sin la dirección cargada no se promete nada: ni el acceso, ni un enlace a una sección que lo anuncie.
  it('sin oficina virtual cargada, no hay acceso a Autogestión', async () => {
    const base = await fuenteLocalJson.contacto();
    const contacto = { ...base, enlaces: { ...base.enlaces, oficinaVirtual: null } };
    const html = await (await AstroContainer.create()).renderToString(BarraSuperior, { props: { contacto } });
    expect(html).not.toContain('Autogestión');
  });
  // Los avisos se fueron a la cinta el 15/09/2026: acá no queda nada que rote.
  it('ya no lleva anuncios rotando', async () => {
    const html = await render();
    expect(html).not.toContain('data-anuncios');
    expect(html).not.toContain('data-pausa');
  });
  // Sin los anuncios, en celular la barra quedaría vacía (los accesos viven en el menú): comería 40 px de nada.
  it('solo se muestra en escritorio, y el alto del header lo acompaña', async () => {
    expect(await render()).toMatch(/class="barra-superior[^"]*\bhidden\b[^"]*\blg:block\b/);
    const tokens = await import('node:fs').then((fs) => fs.readFileSync('src/styles/tokens.css', 'utf8'));
    expect(tokens, 'falta el --alto-header sin barra para pantallas chicas').toMatch(/@media\s*\(width\s*<\s*64rem\)\s*\{\s*:root\s*\{\s*--alto-header:\s*4\.5rem/);
  });
});

describe('Marquesina', () => {
  const dos = [{ id: 'a', texto: 'Primero', tono: 'vial' }, { id: 'b', texto: 'Segundo', tono: 'info', url: '/tarifas' }];

  it('desfila los avisos con su etiqueta y respeta los enlaces internos', async () => {
    const html = await cinta(dos);
    expect(html).toContain('data-marquesina');
    expect(html).toContain('Primero');
    expect(html).toContain('href="/tarifas/"');
    expect(html).toContain('aria-label="Avisos"');
  });

  // El desfile empalma porque la pista lleva los avisos dos veces y se corre media pista. La copia no puede existir
  // para el lector de pantalla ni para el tabulador: si no, cada aviso y cada enlace aparecerían dos veces.
  it('la copia que hace el bucle queda fuera del árbol de accesibilidad y del tabulador', async () => {
    const html = await cinta(dos);
    expect(html.match(/class="marquesina-grupo"/g)?.length, 'esperaba las dos copias').toBe(2);
    expect(html.match(/marquesina-grupo[^>]*aria-hidden="true"/g)?.length, 'la segunda copia va aria-hidden').toBe(1);
    expect(html.match(/tabindex="-1"/g)?.length, 'los enlaces de la copia salen del tabulador').toBe(1);
    const css = await import('node:fs').then((fs) => fs.readFileSync('src/components/Marquesina.astro', 'utf8'));
    expect(css, 'el bucle tiene que correr exactamente media pista').toMatch(/translateX\(-50%\)/);
  });

  // WCAG 2.2.2: se mueve sola y dura más de 5 s, así que tiene que poder frenarse sin mouse.
  it('trae botón de pausa con etiqueta para los dos estados, y frenos por puntero y foco', async () => {
    const html = await cinta(dos);
    expect(html).toContain('aria-label="Pausar los avisos"');
    expect(html).toContain('data-reanudar="Reanudar los avisos"');
    const fuente = await import('node:fs').then((fs) => fs.readFileSync('src/components/Marquesina.astro', 'utf8'));
    expect(fuente).toMatch(/\.marquesina:hover[^{]*animation-play-state:\s*paused|:hover[\s\S]{0,200}animation-play-state:\s*paused/);
    expect(fuente).toMatch(/focus-within/);
    expect(fuente, 'con "menos movimiento" no desfila').toMatch(/prefers-reduced-motion[\s\S]{0,200}animation:\s*none/);
  });

  it('sin avisos vigentes no se dibuja nada', async () => {
    expect(await cinta([])).not.toContain('data-marquesina');
  });

  it('en la home se apoya en el borde de abajo del hero', async () => {
    expect(await cinta(dos, { enHero: true })).toContain('marquesina-hero');
    expect(await cinta(dos)).not.toContain('marquesina-hero');
  });

  it('los avisos del repo validan y hoy hay al menos el del 140', async () => {
    const avisos = await fuenteLocalJson.avisos();
    expect(avisos.map((a) => a.id)).toContain('emergencias-140');
  });
});
