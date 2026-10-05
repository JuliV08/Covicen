import { describe, it, expect } from 'vitest';
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
