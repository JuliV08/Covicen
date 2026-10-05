/** Destino público del acceso al portal; la configuración real pertenece al ambiente. */
export function destinoPortalProveedores(valor = import.meta.env.PUBLIC_PORTAL_PROVEEDORES_URL): string | null {
  if (!valor?.trim()) return null;
  const url = new URL(valor.trim());
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('PUBLIC_PORTAL_PROVEEDORES_URL requiere una URL HTTPS de acceso, sin credenciales, consulta ni fragmento.');
  }
  return url.href;
}
