// Pide la ubicación al celular (solo con permiso, solo HTTPS), la muestra, la copia y la mete en el campo de solo lectura
// del formulario. Si el usuario dice no o el navegador no puede, el resto sigue funcionando. Nada se guarda ni se envía solo.
import { textoUbicacion } from '@/lib/asistencia';

const montar = (raiz: HTMLElement) => {
  const boton = raiz.querySelector<HTMLButtonElement>('[data-ubicar]');
  const salida = raiz.querySelector<HTMLElement>('[data-ubicacion]');
  const copiar = raiz.querySelector<HTMLButtonElement>('[data-copiar]');
  const campo = raiz.querySelector<HTMLInputElement>('input[name="ubicacion"]');
  const estado = raiz.querySelector<HTMLElement>('[data-estado]');
  if (!boton || !salida || !estado) return;
  const decir = (t: string) => { estado.textContent = t; };
  let texto = '';
  boton.addEventListener('click', () => {
    if (!('geolocation' in navigator)) { decir('Este navegador no puede obtener la ubicación. Decile al operador el kilómetro del mojón más cercano.'); return; }
    decir('Buscando tu ubicación…');
    boton.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        texto = textoUbicacion(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
        salida.textContent = texto;
        salida.hidden = false;
        if (campo) campo.value = texto;
        if (copiar) copiar.hidden = false;
        decir('Listo. Dictale estas coordenadas al operador del 140 o copialas.');
        boton.disabled = false;
      },
      (err) => {
        decir(err.code === err.PERMISSION_DENIED ? 'No diste permiso de ubicación. Podés seguir: decile al operador el kilómetro del mojón más cercano.' : 'No se pudo obtener la ubicación. Decile al operador el kilómetro del mojón más cercano.');
        boton.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
  copiar?.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(texto); decir('Ubicación copiada.'); } catch { decir('No se pudo copiar: seleccioná el texto y copialo a mano.'); }
  });
};
const iniciar = () => document.querySelectorAll<HTMLElement>('[data-asistencia]:not([data-montado])').forEach((r) => { r.dataset.montado = ''; montar(r); });
document.addEventListener('astro:page-load', iniciar);

export {};
