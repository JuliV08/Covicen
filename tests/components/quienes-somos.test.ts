import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, it } from 'vitest';
import QuienesSomos from '@/pages/quienes-somos.astro';

describe('/quienes-somos/', () => {
  // La sección se titula "Ocho compromisos que se pueden exigir": lo que diga tiene que ser exigible tal cual.
  // El PETG 54.5 compromete 30 minutos en al menos el 90 % de las ocurrencias mensuales y 40 como techo (livianos),
  // 60 y 72 (pesados). "30 para livianos, 60 para pesados" es una promesa incondicional que el contrato no da, y
  // además contradice lo que la misma web publica en /servicios/.
  it('el compromiso de auxilio publica los tiempos de grúa como los publica servicios.json', async () => {
    const html = await (await AstroContainer.create()).renderToString(QuienesSomos, { request: new Request('https://covicen.test/quienes-somos/') });
    expect(html).toContain('30 minutos en al menos el 90 % de los casos, y nunca más de 40');
    expect(html).toContain('60 minutos en al menos el 90 % de los casos, y nunca más de 72');
    expect(html).not.toMatch(/30 minutos para livianos/);
  });
});
