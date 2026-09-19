// Cuenta regresiva al inicio de operación (00:00 hora Argentina, UTC-3). Después de la fecha, muestra data-despues.
const pad = (n: number) => String(n).padStart(2, '0');
const iniciar = () => {
  const nodo = document.querySelector<HTMLElement>('[data-cuenta-regresiva]');
  if (!nodo) return;
  const [y, m, d] = (nodo.dataset.fecha ?? '').split('-').map(Number);
  if (!y || !m || !d) return;
  const objetivo = Date.UTC(y, m - 1, d, 3, 0, 0);
  const texto = nodo.querySelector<HTMLElement>('[data-texto]');
  if (!texto) return;
  const pintar = () => {
    const resta = objetivo - Date.now();
    if (resta <= 0) {
      texto.textContent = nodo.dataset.despues ?? '';
      return;
    }
    const dias = Math.floor(resta / 86_400_000);
    const horas = Math.floor((resta % 86_400_000) / 3_600_000);
    const minutos = Math.floor((resta % 3_600_000) / 60_000);
    const segundos = Math.floor((resta % 60_000) / 1000);
    texto.innerHTML = `Inicio de operación en <strong class="tabular-nums text-texto">${dias} d · ${pad(horas)} h · ${pad(minutos)} min · ${pad(segundos)} s</strong>`;
  };
  pintar();
  const id = window.setInterval(pintar, 1000);
  document.addEventListener('astro:before-swap', () => window.clearInterval(id), { once: true });
};
document.addEventListener('astro:page-load', iniciar);

export {};
