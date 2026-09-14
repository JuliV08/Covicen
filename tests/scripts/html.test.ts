import { describe, expect, it } from 'vitest';
import { jsonLdDe, linksInternos, normalizarHref, textoVisible } from '../../scripts/lib/html.ts';

describe('linksInternos', () => {
  it('devuelve solo hrefs internos, sin anclas ni externos ni tel/mailto', () => {
    const html = `<a href="/tarifas/">a</a><a href="/obras/#x">b</a><a href="https://x.com">c</a><a href="tel:1">d</a><a href="mailto:a@b">e</a><a href="#arriba">f</a>`;
    expect(linksInternos(html)).toEqual(['/tarifas/', '/obras/']);
  });
});

describe('normalizarHref', () => {
  it('quita base y resuelve a index.html', () => {
    expect(normalizarHref('/covicen/tarifas/', '/covicen/')).toBe('tarifas/index.html');
    expect(normalizarHref('/covicen/og.png', '/covicen/')).toBe('og.png');
    expect(normalizarHref('/', '/')).toBe('index.html');
  });
});

describe('jsonLdDe', () => {
  it('parsea todos los bloques', () => {
    const html = `<script type="application/ld+json">{"@type":"A"}</script><p></p><script type="application/ld+json">{"@type":"B"}</script>`;
    expect(jsonLdDe(html).map((x) => (x as { '@type': string })['@type'])).toEqual(['A', 'B']);
  });
});

describe('textoVisible', () => {
  it('saca scripts, estilos y etiquetas, deja el texto', () => {
    expect(textoVisible('<head><script>x=681</script><style>.a{}</style></head><body><p class="k681">Hola <b>mundo</b></p></body>').replace(/\s+/g, ' ').trim()).toBe('Hola mundo');
  });
});
