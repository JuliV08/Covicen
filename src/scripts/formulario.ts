// Arma el mensaje con todos los campos y lo manda por WhatsApp (o mail). Valida en cliente con mensajes en español.
const mensajeDe = (v: ValidityState): string =>
  v.valueMissing ? 'Completá este campo.' : v.typeMismatch ? 'Revisá el formato.' : v.tooShort ? 'Es muy corto.' : 'Revisá este campo.';
const iniciar = () => {
  document.querySelectorAll<HTMLFormElement>('[data-formulario]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valido = true;
      form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('.campo').forEach((campo) => {
        const error = form.querySelector<HTMLElement>(`[data-error-de="${campo.name}"]`);
        const ok = campo.checkValidity();
        campo.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (error) {
          error.textContent = ok ? '' : mensajeDe(campo.validity);
          error.classList.toggle('hidden', ok);
        }
        if (!ok) valido = false;
      });
      if (!valido) { form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
      const datos = new FormData(form);
      const lineas = [`Asunto: ${form.dataset.asunto ?? ''}`];
      form.querySelectorAll<HTMLLabelElement>('label').forEach((l) => {
        const nombre = l.htmlFor.replace('campo-', '');
        const valor = String(datos.get(nombre) ?? '').trim();
        if (valor) lineas.push(`${l.textContent?.replace('*', '').trim()}: ${valor}`);
      });
      const texto = lineas.join('\n');
      const wa = form.dataset.whatsapp;
      const mail = form.dataset.email;
      if (wa) window.open(`https://wa.me/${wa}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
      else if (mail) window.location.href = `mailto:${mail}?subject=${encodeURIComponent(form.dataset.asunto ?? '')}&body=${encodeURIComponent(texto)}`;
    });
  });
};
document.addEventListener('astro:page-load', iniciar);

// Todos los scripts de src/scripts/ terminan con esto: sin import/export, TypeScript los trata como
// scripts globales y `iniciar` choca entre archivos ("Cannot redeclare block-scoped variable").
export {};
