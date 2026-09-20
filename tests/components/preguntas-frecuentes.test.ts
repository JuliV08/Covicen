import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Preguntas from '@/pages/preguntas-frecuentes.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { preguntasPublicables } from '@/lib/faq';
import { publicado } from '@/lib/publicado';

// Esto lo encontró la revisión, no los tests, y es la clase de error más cara que tiene este sitio: se escondieron
// cinco secciones de Tarifas por falta de certificación del área, y las preguntas frecuentes siguieron publicando
// EXACTAMENTE esos números —los porcentajes de descuento, los recargos por pasar sin pagar, la tarifa vecinal—,
// además de mandarlos al JSON-LD, o sea a Google. El dato quedaba escondido en una página y publicado en otra, que
// es peor que no esconderlo: da la sensación de que se ocultó algo.
//
// La causa: cada página se escondió por su lado y nadie miraba el conjunto. El candado de verdad está en
// scripts/verificar.ts (chequeo 10c), que barre el dist entero; esto fija el comportamiento del filtro.
const render = async () => (await AstroContainer.create()).renderToString(Preguntas, { request: new Request('https://covicen.test/preguntas-frecuentes/') });

describe('/preguntas-frecuentes/', () => {
  it('no publica ninguna cifra que el interruptor tenga apagada', async () => {
    const visible = (await render()).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    for (const cifra of ['pasada 36', 'pasada 45', 'pasada 61', 'dos tarifas', 'tarifa vecinal',
                         'tarifa diferencial', 'tarifas diferenciales', 'frentista', 'sin barreras']) {
      expect(visible.toLowerCase().includes(cifra.toLowerCase()), `publica "${cifra}", que está escondido`).toBe(false);
    }
  });

  // El FAQPage del JSON-LD es lo que lee Google. Si el filtro se aplicara solo a lo visible, las respuestas
  // escondidas se seguirían indexando: el dato escondido terminaría en los resultados de búsqueda.
  it('el JSON-LD sale de la misma lista filtrada que la página', async () => {
    const html = await render();
    const bloque = /<script type="application\/ld\+json">(.*?)<\/script>/gs;
    const faqPage = [...html.matchAll(bloque)].map((m) => JSON.parse(m[1]!)).find((b) => b['@type'] === 'FAQPage');
    expect(faqPage, 'falta el FAQPage').toBeTruthy();
    const preguntas = (faqPage.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>);
    const enJsonLd = preguntas.map((p) => `${p.name} ${p.acceptedAnswer.text}`).join(' ').toLowerCase();
    for (const cifra of ['pasada 36', 'dos tarifas', 'tarifa vecinal']) {
      expect(enJsonLd.includes(cifra), `el JSON-LD indexa "${cifra}", que está escondido`).toBe(false);
    }
    // Y que el filtro no se haya llevado puesto todo: las que sí están confirmadas siguen.
    expect(preguntas.length, 'el filtro dejó la página casi vacía').toBeGreaterThan(8);
  });

  it('el filtro esconde exactamente tres preguntas y ninguna más', async () => {
    const todas = await fuenteLocalJson.faq();
    const publicables = preguntasPublicables(todas);
    expect(todas.length - publicables.length).toBe(3);
    expect(publicado.descuentosPorFrecuencia || publicado.pasasteSinPagar || publicado.tarifaDiferencial,
      'se prendió algún interruptor: este test mide el otro estado').toBe(false);
  });

  // Las preguntas escondidas NO se borran: son lo que vuelve cuando el área confirme.
  it('las preguntas escondidas siguen versionadas', async () => {
    const slugs = (await fuenteLocalJson.faq()).map((p) => p.slug);
    for (const slug of ['descuentos-por-frecuencia', 'pase-sin-pagar', 'tarifa-vecinal']) {
      expect(slugs, `se borró la pregunta ${slug} en vez de esconderla`).toContain(slug);
    }
  });

  // El candado mecánico es lo único que cubre una página futura que nadie previó. Si alguien lo vacía, este test lo dice.
  it('verificar.ts ata el interruptor con lo que se emite', () => {
    const fuente = readFileSync('scripts/verificar.ts', 'utf8');
    expect(fuente).toContain('TEXTOS_SIN_CERTIFICAR');
    for (const clave of ['descuentosPorFrecuencia', 'tarifaDiferencial', 'pasasteSinPagar', 'excesoDeCarga', 'categoriasFuturas']) {
      expect(fuente.includes(`'${clave}'`), `el candado no cubre ${clave}`).toBe(true);
    }
    expect(fuente).toMatch(/if \(publicado\[clave\]\) continue;/);
  });
});
