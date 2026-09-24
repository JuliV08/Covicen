import { readFileSync } from 'node:fs';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Formulario from '@/components/Formulario.astro';

const campos = [{ nombre: 'nombre', etiqueta: 'Nombre', requerido: true }, { nombre: 'mensaje', etiqueta: 'Mensaje', tipo: 'textarea' }];
const render = async (props: Record<string, unknown>) => (await AstroContainer.create()).renderToString(Formulario, { props: { asunto: 'Consulta', campos, ...props } });
const etiquetaForm = (html: string) => /<form[^>]*>/.exec(html)?.[0] ?? '';

describe('Formulario', () => {
  it('con WhatsApp: labels asociados, botón de envío y plazos', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, plazos: 'Acuse en 24 hs · Respuesta en 5 días hábiles' });
    expect(html).toContain('data-canal="whatsapp"');
    expect(html).toContain('<label for="campo-nombre"');
    expect(html).toContain('id="campo-nombre"');
    expect(html).toContain('type="submit"');
    expect(html).toContain('Acuse en 24 hs');
  });
  // El envío lo hace siempre formulario.ts. Con action + method="get" el navegador pisa la query del action con los
  // campos serializados: los datos personales viajarían en la URL a un servidor de Meta y el ?text= se perdería.
  it('el <form> no envía solo: sin action, method ni target, y con <noscript> que da los canales pelados', async () => {
    const html = await render({ whatsapp: '5493510000000', email: 'hola@covicen.test' });
    expect(etiquetaForm(html)).not.toMatch(/\saction=/);
    expect(etiquetaForm(html)).not.toMatch(/\smethod=/);
    expect(etiquetaForm(html)).not.toMatch(/\starget=/);
    expect(html).not.toContain('action="https://wa.me');
    const noscript = /<noscript>[\s\S]*?<\/noscript>/.exec(html)?.[0] ?? '';
    expect(noscript).toContain('href="tel:140"');
    expect(noscript).toContain('href="https://wa.me/5493510000000"');
    expect(noscript).toContain('href="mailto:hola@covicen.test"');
    // el wa.me y el mailto del <noscript> van pelados: sin ?text= ni campos del usuario
    expect(noscript).not.toContain('?text=');
    expect(noscript).not.toMatch(/mailto:[^"]*\?/);
  });
  // Con la primera opción seleccionada y con value, `required` nunca falla: "Motivo" viajaba como "Reclamo" sin elegir.
  it('select requerido: primero una opción vacía y deshabilitada; el select opcional no la lleva', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, campos: [
      { nombre: 'motivo', etiqueta: 'Motivo', tipo: 'select', opciones: ['Reclamo', 'Consulta'], requerido: true },
      { nombre: 'estacion', etiqueta: 'Estación', tipo: 'select', opciones: ['Carcarañá', 'Leones'] },
    ] });
    expect(html).toMatch(/<select[^>]*id="campo-motivo"[^>]*><option value="" selected disabled[^>]*>Elegí una opción<\/option><option value="Reclamo"/);
    expect(html).toMatch(/<select[^>]*id="campo-estacion"[^>]*><option value="Carcarañá"[^>]*>Carcarañá<\/option>/);
  });
  // Pliego 61.7 (spec §11): cada interacción con respuesta visible.
  it('hay un aviso de envío con role="status" debajo del botón', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null });
    expect(html).toMatch(/<p[^>]*role="status"[^>]*data-envio/);
  });
  it('sin canales: lo dice con la fecha y el 140, y el botón queda deshabilitado sin prometer envío', async () => {
    const html = await render({ whatsapp: null, email: null });
    expect(html).toContain('data-canal="a-confirmar"');
    expect(html).toContain('Los formularios se habilitan con la toma de posesión, el 5 de octubre de 2026. Mientras, el');
    expect(html).toMatch(/<a href="tel:140"[^>]*>140<\/a> atiende emergencias las 24 horas\./);
    // El botón de envío existe (WCAG H32: todo <form> tiene uno) pero está deshabilitado y no nombra ningún canal.
    expect(html).toMatch(/<button type="submit" disabled/);
    expect(html).not.toContain('Enviar por WhatsApp');
    expect(html).not.toContain('Enviar por correo');
  });
  // Spec §10.2 punto 3: sin canal, asistencia igual arma el texto para copiar. Nada se simula.
  it('sin canales con sinCanal="copiar": campos habilitados, botón que arma el texto y bloque para copiarlo', async () => {
    const html = await render({ whatsapp: null, email: null, sinCanal: 'copiar', plazos: 'Respuesta inmediata' });
    expect(html).toContain('data-modo="copiar"');
    expect(html).not.toMatch(/<fieldset[^>]*\sdisabled[\s>]/);
    expect(html).not.toMatch(/<button type="submit" disabled/);
    expect(html).toContain('Armar el texto para copiar');
    expect(html).toContain('data-copia');
    expect(html).toContain('data-copiar-texto');
    expect(html).not.toContain('Los formularios se habilitan');
    // sin canal no hay a quién le llegue: no se prometen plazos de respuesta
    expect(html).not.toContain('Respuesta inmediata');
  });
  it('el modo copiar es solo para quien lo pide: por defecto sigue deshabilitado', async () => {
    const html = await render({ whatsapp: null, email: null });
    expect(html).toContain('data-modo="enviar"');
    expect(html).toMatch(/<fieldset[^>]*\sdisabled[\s>]/);
    expect(html).not.toContain('data-copiar-texto');
  });
  // 24/09/2026: el formulario apagado se veía «transparente y mal». Era la opacidad al 60 % del fieldset y del botón:
  // sobre la grilla del fondo, los campos la dejaban ver. Apagado sí, pero opaco: lo marcan el borde punteado y el gris.
  it('apagado sin transparencia: ni el fieldset ni el botón bajan la opacidad', async () => {
    const html = await render({ whatsapp: null, email: null });
    expect(/<fieldset[^>]*>/.exec(html)?.[0], 'el fieldset apagado volvió a ser translúcido').not.toMatch(/opacity/);
    expect(/<button type="submit"[^>]*>/.exec(html)?.[0], 'el botón apagado volvió a ser translúcido').not.toMatch(/opacity/);
    const estilo = /<style>([\s\S]*)<\/style>/.exec(readFileSync('src/components/Formulario.astro', 'utf8'))?.[1] ?? '';
    expect(estilo).toMatch(/fieldset:disabled \.campo\s*\{[^}]*border-style:\s*dashed/);
    expect(estilo).not.toMatch(/opacity/);
  });
  it('campo de solo lectura: input readonly con su label (entra al mensaje)', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, campos: [{ nombre: 'ubicacion', etiqueta: 'Ubicación', tipo: 'readonly', valor: '' }] });
    expect(html).toMatch(/<input[^>]*id="campo-ubicacion"[^>]*readonly/);
    expect(html).toContain('<label for="campo-ubicacion"');
  });
  it('con id: los ids de campos y errores llevan el id del formulario (dos formularios en una página no chocan)', async () => {
    const html = await render({ whatsapp: '5493510000000', email: null, id: 'reclamos' });
    expect(html).toContain('<label for="reclamos-campo-nombre"');
    expect(html).toContain('id="reclamos-campo-nombre"');
    expect(html).toContain('aria-describedby="reclamos-error-nombre"');
    expect(html).toContain('id="reclamos-error-nombre"');
    expect(html).not.toContain('id="campo-nombre"');
  });
});
