import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import FormularioCrm from '@/components/FormularioCrm.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';

// 01/10/2026: el formulario de reclamos de /contacto/ pasa a ser el del CRM de atención al usuario (Bitrix24, lo
// administra PREVI). El código que entregó Bitrix, tal cual:
// <script data-b24-form="inline/1/t2c138" data-skip-moving="true">(function(w,d,u){…})(window,document,'https://cdn.bitrix24.es/b39125905/crm/form/loader_1.js');</script>
const crm = { codigo: 'inline/1/t2c138', script: 'https://cdn.bitrix24.es/b39125905/crm/form/loader_1.js' };
const render = async () => (await AstroContainer.create()).renderToString(FormularioCrm, { props: { crm, id: 'reclamos', plazos: 'Acuse en 24 horas · Respuesta en 5 días hábiles' } });

describe('FormularioCrm', () => {
  it('el dato de contacto trae el formulario que entregó Bitrix', async () => {
    expect((await fuenteLocalJson.contacto()).formularioCrm).toEqual(crm);
  });

  // Bitrix busca `script[data-b24-form]` y monta el formulario en un <div> que inserta ANTES de ese script: si Astro
  // lo procesara (lo empaqueta, le cambia el tipo a module o lo saca de su lugar), el formulario no aparecería.
  it('emite el script de Bitrix en su lugar, sin procesar, con el cargador del dato', async () => {
    const html = await render();
    const script = /<script\b[^>]*data-b24-form[^>]*>[\s\S]*?<\/script>/.exec(html)?.[0] ?? '';
    expect(script, 'falta el script de Bitrix').not.toBe('');
    expect(script).toContain('data-b24-form="inline/1/t2c138"');
    expect(script).toContain('data-skip-moving="true"');
    expect(script).not.toMatch(/type="module"|\ssrc=/);
    expect(script).toContain("s.src=u+'?'+(Date.now()/180000|0)");
    expect(script).toContain('(window,document,"https://cdn.bitrix24.es/b39125905/crm/form/loader_1.js");');
    // El script va adentro del contenedor del formulario, que es el que lleva el id al que apuntan los enlaces.
    const contenedor = html.indexOf('id="reclamos"');
    expect(contenedor, 'falta el id="reclamos"').toBeGreaterThanOrEqual(0);
    expect(contenedor).toBeLessThan(html.indexOf('data-b24-form'));
  });

  // Lo que el formulario de Bitrix no muestra y la web sí tiene que dar: los plazos del contrato, el aviso de adónde
  // van los datos, y una salida si el formulario no llega (sin JavaScript o con un bloqueador).
  it('pone los plazos, el aviso de privacidad y el respaldo con el 140', async () => {
    const html = await render();
    expect(html).toContain('Acuse en 24 horas · Respuesta en 5 días hábiles');
    expect(html).toContain('Bitrix24');
    expect(html).toContain('href="/privacidad/"');
    const respaldo = /<p class="crm-respaldo[\s\S]*?<\/p>/.exec(html)?.[0] ?? '';
    expect(respaldo).toContain('href="tel:140"');
  });
});
