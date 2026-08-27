import type { Contacto, Empresa, Novedad, Pregunta } from '@/lib/datos/esquemas';

type JsonLd = Record<string, unknown>;

export const jsonLdOrganizacion = (e: Empresa, c: Contacto, sitio: string, logoUrl: string): JsonLd => {
  const o: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: e.marca,
    alternateName: e.descriptor,
    url: sitio,
    logo: logoUrl,
    description: `Concesionaria del Tramo Centro de la Red Federal de Concesiones: ${e.concesion.rutas.join(', ')} en ${e.concesion.provincias.join(' y ')}.`,
    areaServed: e.concesion.provincias.map((p) => ({ '@type': 'AdministrativeArea', name: p })),
    // Sin foundingDate: la sociedad está en formación; la adjudicación no es una fecha de fundación.
  };
  if (e.razonSocial) o.legalName = e.razonSocial;
  if (e.cuit) o.taxID = e.cuit;
  if (c.emergencias.telefono) {
    o.contactPoint = [
      { '@type': 'ContactPoint', telephone: c.emergencias.telefono, contactType: 'emergency', areaServed: 'AR', availableLanguage: 'es' },
    ];
  }
  const sameAs = Object.values(c.redes).filter(Boolean);
  if (sameAs.length) o.sameAs = sameAs;
  return o;
};

export const jsonLdSitioWeb = (sitio: string): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Covicen',
  url: sitio,
  inLanguage: 'es-AR',
});

export const jsonLdFaq = (preguntas: Pregunta[]): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: preguntas.map((p) => ({
    '@type': 'Question',
    name: p.pregunta,
    acceptedAnswer: { '@type': 'Answer', text: p.respuesta },
  })),
});

export const jsonLdMigas = (migas: Array<{ nombre: string; url: string }>): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: migas.map((m, i) => ({ '@type': 'ListItem', position: i + 1, name: m.nombre, item: m.url })),
});

export const jsonLdArticulo = (n: Novedad, url: string, sitio: string): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: n.titulo,
  description: n.resumen,
  datePublished: n.fecha,
  dateModified: n.fecha,
  inLanguage: 'es-AR',
  mainEntityOfPage: url,
  author: { '@type': 'Organization', name: 'Covicen', url: sitio },
  publisher: { '@type': 'Organization', name: 'Covicen', url: sitio },
});
