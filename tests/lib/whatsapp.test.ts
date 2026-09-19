import { describe, expect, it } from 'vitest';
import { enlaceWhatsapp, mensajeContacto } from '@/lib/whatsapp';

describe('whatsapp', () => {
  it('arma el link wa.me con el texto codificado', () => {
    expect(enlaceWhatsapp('5493510000000', 'Hola, ¿qué tal?')).toBe('https://wa.me/5493510000000?text=Hola%2C%20%C2%BFqu%C3%A9%20tal%3F');
  });
  it('mensajeContacto lista asunto y campos, ignora vacíos', () => {
    expect(mensajeContacto('Reclamo', { Nombre: 'Ana', Ruta: 'RN 9', Km: '' })).toBe('Asunto: Reclamo\nNombre: Ana\nRuta: RN 9');
  });
});
