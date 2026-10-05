import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import Canales from '@/components/Canales.astro';
import MediosDePago from '@/pages/medios-de-pago.astro';
import Servicios from '@/pages/servicios.astro';
import ServiciosHome from '@/components/home/Servicios.astro';
import { fuenteLocalJson } from '@/lib/datos/fuentes/local-json';
import { publicado } from '@/lib/publicado';
import { serviciosPublicables } from '@/lib/servicios';

describe('Canales', () => {
  const render = async (compacto = false) => (await AstroContainer.create()).renderToString(Canales, { props: { canales: (await fuenteLocalJson.contacto()).canales, compacto } });
  // Reunión con el gerente del 01/10/2026: la tabla deja de mostrar acuse y respuesta (siguen en Contacto, en los pasos
  // del reclamo y al lado del formulario), el correo lleva su dirección y el WhatsApp se esconde («falta solicitar»).
  it('lista los canales sin acuse ni respuesta; los no habilitados lo dicen sin relleno', async () => {
    const html = await render();
    expect(html).toContain('href="tel:140"');
    expect(html).not.toMatch(/>Acuse<|>Respuesta</);
    expect(html).not.toContain('5 días hábiles');
    expect(html).not.toContain('Los plazos de respuesta pueden ampliarse');
    // Desde el 05/10/2026 el 0800 tiene número: no queda ningún canal visible sin habilitar.
    expect(html).not.toContain('Se habilita con la toma de posesión');
    expect(html).toContain('href="tel:08004447777"');
    expect(html).not.toMatch(/a confirmar/i);
    expect(html).toContain('<caption');
  });
  it('el correo de atención al usuario va con su dirección, y el WhatsApp no está', async () => {
    const html = await render();
    expect(html).toContain('href="mailto:atencionalusuario@covicen.com.ar"');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('Se habilita a los 90 días');
  });
  it('en compacto queda solo la columna del canal', async () => {
    const html = await render(true);
    expect(html.match(/<th scope="col"/g)?.length).toBe(1);
  });
});

// 24/09/2026. El gerente pidió sacar de Servicios la sección «Más adelante» (oficina virtual y seguimiento de reclamos,
// las dos «Próximamente»). La oficina virtual se definió el 25/09 (Autogestión de Telepeaje Plus): en Medios de pago
// aparece su sección, que dice solo lo que Telepeaje Plus publica que se hace ahí.
describe('lo que no existe todavía no se promete', () => {
  const render = async (Pagina: unknown, url: string) =>
    (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
  it('/servicios/ no tiene la sección «Más adelante» ni tarjetas «Próximamente»', async () => {
    const html = await render(Servicios, '/servicios/');
    expect(html).not.toContain('Más adelante');
    expect(html).not.toContain('Lo que se suma cuando existan los sistemas');
    expect(html).not.toContain('Próximamente');
    expect(html).not.toContain('data-capacidad=');
  });
  it('/medios-de-pago/ muestra Autogestión con su dirección, sin prometer lo que no está verificado', async () => {
    expect((await fuenteLocalJson.contacto()).enlaces.oficinaVirtual).toBe('https://www.telepeajeplus.com/Login');
    const html = await render(MediosDePago, '/medios-de-pago/');
    const seccion = /<section id="autogestion"[\s\S]*?<\/section>/.exec(html)?.[0] ?? '';
    expect(seccion, 'falta la sección de Autogestión').toContain('Telepeaje Plus');
    expect(seccion).toMatch(/href="https:\/\/www\.telepeajeplus\.com\/Login"/);
    // La versión anterior prometía pasadas, facturas, deuda, comprobantes y pagos: nadie lo verificó.
    for (const promesa of ['pasadas', 'facturas', 'deuda', 'comprobantes']) expect(seccion, `volvió a prometer «${promesa}»`).not.toContain(promesa);
    expect(html).not.toContain('id="mi-cuenta"');
    expect(html).not.toContain('Se habilita con la toma de posesión');
    expect(html).toContain('id="telepase"');
  });
  // La descripción para buscadores ofrecía «dónde se coloca el dispositivo», una tarjeta escondida desde el 20/09.
  it('/medios-de-pago/ no ofrece en Google lo que la página no muestra', async () => {
    const html = await render(MediosDePago, '/medios-de-pago/');
    const descripcion = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(descripcion).toContain('autogestión');
    expect(html.includes('Dónde se coloca'), 'se cargó la colocación: revisar este test').toBe(false);
    expect(descripcion).not.toContain('dónde se coloca');
  });
  // 01/10/2026: en la vía se cobra solo con medios electrónicos, en las terminales POS. La tarjeta decía «Contado en la
  // vía · Efectivo o medios electrónicos». `verificar.ts` rechaza además la palabra en todo el sitio emitido.
  it('/medios-de-pago/ en la vía ofrece solo pago electrónico con POS, sin efectivo', async () => {
    const html = await render(MediosDePago, '/medios-de-pago/');
    expect(html).toContain('Pago electrónico en la vía');
    expect(html).toContain('terminales POS');
    expect(html).not.toMatch(/efectivo|contado en la v/i);
  });
});

// Reunión con el gerente del 01/10/2026. «TelePASE sin costo» y «Sanitarios» quedan «a confirmar», y un dato sin
// confirmar se esconde en TODAS sus apariciones (no solo en la tarjeta que se marcó): Servicios, Medios de pago, la
// home y la pregunta frecuente. Además se esconden «Servicios que se cobran» y la tabla de canales de Servicios, y se
// quita el alcance de los móviles.
describe('lo que se escondió el 01/10/2026', () => {
  const render = async (Pagina: unknown, url: string) =>
    (await AstroContainer.create()).renderToString(Pagina as never, { request: new Request(`https://covicen.test${url}`) });
  it('los interruptores están apagados (este archivo mide ese estado)', () => {
    for (const clave of ['serviciosConCosto', 'canalesEnServicios', 'telepaseSinCosto', 'sanitariosPublicos', 'canalWhatsapp'] as const) {
      expect(publicado[clave], `se prendió ${clave}: revisar este test`).toBe(false);
    }
  });
  it('/servicios/ sin lo que se cobra, sin canales, sin sanitarios ni TelePASE gratis, y sin el alcance de los móviles', async () => {
    const html = await render(Servicios, '/servicios/');
    for (const rastro of ['Servicios que se cobran', 'Mecánica general', 'Remolque más allá', 'id="canales"', 'Canales de atención',
      'Sanitarios públicos', 'TelePASE sin costo', 'Un móvil sobre la RN 9', 'Alcance:</span> Un móvil', 'WhatsApp']) {
      expect(html, `quedó «${rastro}»`).not.toContain(rastro);
    }
    expect(html).toContain('Móviles de seguridad vial');
    expect(html).toContain('Estos son los servicios que tenés a disposición cuando viajás por nuestras rutas.');
    expect(html).not.toContain('obliga a prestarlos');
    const descripcion = /<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(descripcion).not.toMatch(/TelePASE sin costo|se cobran/);
  });
  it('/medios-de-pago/ no dice que TelePASE es gratis', async () => {
    const html = await render(MediosDePago, '/medios-de-pago/');
    for (const rastro of ['El dispositivo es gratis', 'Gratis, y en todas las estaciones', 'no tienen costo para el usuario', 'dispositivo sin cargo']) {
      expect(html, `quedó «${rastro}»`).not.toContain(rastro);
    }
    expect(html).toContain('En todas las estaciones.');
  });
  it('la home tampoco: ni TelePASE gratis ni los móviles por ruta', async () => {
    const html = await (await AstroContainer.create()).renderToString(ServiciosHome, { props: {} });
    expect(html).not.toContain('TelePASE gratis');
    expect(html).not.toContain('en RN 9 y RN 19');
    expect(html).toContain('pago electrónico en la vía');
  });
  // Lo escondido NO se borra: es lo que vuelve cuando se confirme. Y el filtro esconde exactamente esas dos tarjetas.
  it('«TelePASE sin costo» y «Sanitarios públicos» siguen en servicios.json, y el filtro saca solo esas dos', async () => {
    const todos = await fuenteLocalJson.servicios();
    const ids = todos.map((x) => x.id);
    for (const id of ['telepase-gratuito', 'sanitarios']) expect(ids, `se borró ${id} en vez de esconderlo`).toContain(id);
    const fuera = ids.filter((id) => !serviciosPublicables(todos).some((x) => x.id === id));
    expect(fuera).toEqual(['telepase-gratuito', 'sanitarios']);
  });
});
