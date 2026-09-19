// Arma el mensaje con todos los campos y lo manda por WhatsApp (o mail). Valida en cliente con mensajes en español.
// Sin canal cargado y con data-modo="copiar" (asistencia, spec §10.2) muestra el texto armado y lo copia: nada se
// simula. Todo envío deja una respuesta visible en [data-envio] (pliego 61.7, spec §11).
import { textoDelMensaje } from '@/lib/formulario';

type CampoDelForm = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
const mensajeDe = (campo: CampoDelForm): string => {
  const v = campo.validity;
  if (v.valueMissing) return campo instanceof HTMLSelectElement ? 'Elegí una opción.' : 'Completá este campo.';
  return v.typeMismatch ? 'Revisá el formato.' : v.tooShort ? 'Es muy corto.' : 'Revisá este campo.';
};
const iniciar = () => {
  document.querySelectorAll<HTMLFormElement>('[data-formulario]').forEach((form) => {
    const aviso = form.querySelector<HTMLElement>('[data-envio]');
    // Se muestra ANTES de escribir: así la región `role="status"` ya está en el árbol cuando cambia el texto.
    const decir = (t: string) => { if (aviso) { aviso.hidden = false; aviso.textContent = t; } };
    const bloqueCopia = form.querySelector<HTMLElement>('[data-copia]');
    const salida = form.querySelector<HTMLElement>('[data-texto]');
    let armado = '';
    const copiar = async () => {
      try {
        await navigator.clipboard.writeText(armado);
        decir('Texto copiado. Pegalo donde quieras o dictáselo al operador del 140.');
      } catch {
        decir('No se pudo copiar solo: seleccioná el texto de acá abajo y copialo a mano.');
      }
    };
    form.querySelector<HTMLButtonElement>('[data-copiar-texto]')?.addEventListener('click', () => void copiar());
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valido = true;
      form.querySelectorAll<CampoDelForm>('.campo').forEach((campo) => {
        const error = form.querySelector<HTMLElement>(`[data-error-de="${campo.name}"]`);
        const ok = campo.checkValidity();
        campo.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (error) {
          error.textContent = ok ? '' : mensajeDe(campo);
          error.hidden = ok;
        }
        if (!ok) valido = false;
      });
      if (!valido) { form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
      const datos = new FormData(form);
      // Recorre los CAMPOS (no las etiquetas): así entran también los de solo lectura que rellena un script (ubicación).
      armado = textoDelMensaje(form.dataset.asunto ?? '', [...form.querySelectorAll<CampoDelForm>('.campo')].map((campo) => ({
        etiqueta: form.querySelector<HTMLLabelElement>(`label[for="${campo.id}"]`)?.textContent?.replace('*', '').trim() ?? campo.name,
        valor: String(datos.get(campo.name) ?? ''),
      })));
      const wa = form.dataset.whatsapp;
      const mail = form.dataset.email;
      if (form.dataset.modo === 'copiar') {
        if (salida) salida.textContent = armado;
        if (bloqueCopia) bloqueCopia.hidden = false;
        void copiar();
      } else if (wa) {
        window.open(`https://wa.me/${wa}?text=${encodeURIComponent(armado)}`, '_blank', 'noopener');
        decir('Abrimos WhatsApp en otra pestaña con el mensaje armado. Si no se abrió, fijate si el navegador bloqueó la ventana.');
      } else if (mail) {
        window.location.href = `mailto:${mail}?subject=${encodeURIComponent(form.dataset.asunto ?? '')}&body=${encodeURIComponent(armado)}`;
        decir('Abrimos tu programa de correo con el mensaje armado.');
      }
    });
  });
};
document.addEventListener('astro:page-load', iniciar);

// Todos los scripts de src/scripts/ terminan con esto: sin import/export, TypeScript los trata como
// scripts globales y `iniciar` choca entre archivos ("Cannot redeclare block-scoped variable").
export {};
