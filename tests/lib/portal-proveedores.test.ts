import { describe, it, expect, vi } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import Proveedores from '../../src/pages/proveedores/[...resto].astro';
import { destinoPortalProveedores } from '../../src/lib/datos/portal-proveedores';
describe('destino del portal de proveedores', () => {
  it('conserva el registro anterior sin configuración', () => {
    expect(destinoPortalProveedores('')).toBeNull();
    expect(destinoPortalProveedores('  ')).toBeNull();
  });
  it('sólo enlaza el acceso HTTPS configurado', () => {
    expect(destinoPortalProveedores('https://proveedores.example.test/proveedores/acceso')).toBe('https://proveedores.example.test/proveedores/acceso');
    for (const valor of ['http://proveedores.example.test', 'javascript:alert(1)', 'https://u:p@proveedores.example.test', 'https://proveedores.example.test/#t=secreto', 'https://proveedores.example.test/?token=secreto']) {
      expect(() => destinoPortalProveedores(valor)).toThrow();
    }
  });
});

// Con el destino configurado la página enlaza al acceso del ERP y describe el portal vigente (19/10/2026): cuenta creada
// desde la invitación, CUIT y contraseña, y las seis entradas. La web no recibe credenciales: sólo enlaza.
describe('la página /proveedores/ con el destino configurado', () => {
  it('muestra el botón al acceso y el portal vigente, y conserva el registro para empresas nuevas', async () => {
    vi.stubEnv('PUBLIC_PORTAL_PROVEEDORES_URL', 'https://erp.example.test/proveedores/acceso');
    try {
      const html = await (await AstroContainer.create()).renderToString(Proveedores as never, { request: new Request('https://covicen.test/proveedores/') });
      expect(html).toContain('href="https://erp.example.test/proveedores/acceso"');
      expect(html).toContain('Ingresar al portal');
      expect(html).toContain('CUIT de tu empresa y tu contraseña');
      expect(html).toContain('«Crear mi cuenta»');
      for (const entrada of ['Mi empresa', 'Ofertas', 'Órdenes de compra', 'Remitos', 'Facturas', 'Pagos y retenciones']) expect(html).toContain(entrada);
      expect(html, 'con el botón no hay «Próximamente»').not.toContain('Próximamente');
      expect(html, 'el registro de empresas nuevas sigue').toContain('data-b24-form=');
      expect(html).not.toMatch(/type="password"/);
    } finally {
      vi.unstubAllEnvs();
    }
  }, 20_000);
});
