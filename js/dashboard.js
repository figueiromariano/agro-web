// ── dashboard.js ──────────────────────────────────────────────────────────
// Actualiza las cards del dashboard con la última lectura de cada sensor.

import { estado }                              from './firebase.js';
import { setText, tendenciaPresion, interpretarHumedad } from './utils.js';

export function renderDashboard() {
  const { ultimoBmp, ultimoDht, bmpHist } = estado;

  if (ultimoBmp) {
    setText('dash-presion',  ultimoBmp.presion    ? ultimoBmp.presion.toFixed(1)    : '--');
    setText('dash-temp-bmp', ultimoBmp.temperatura ? ultimoBmp.temperatura.toFixed(1) : '--');
    setText('dash-altitud',  ultimoBmp.altitud     ? ultimoBmp.altitud.toFixed(0)    : '--');

    const tend = tendenciaPresion(bmpHist);
    const el   = document.getElementById('dash-tendencia');
    if (el) {
      el.textContent = `${tend.icono} ${tend.texto}`;
      el.className   = `text-xs font-medium mt-2 ${tend.clase}`;
    }
  }

  if (ultimoDht) {
    setText('dash-humedad',  ultimoDht.humedad     !== undefined ? ultimoDht.humedad          : '--');
    setText('dash-temp-dht', ultimoDht.temperatura ? ultimoDht.temperatura.toFixed(1) : '--');

    const interp = interpretarHumedad(ultimoDht.humedad);
    const el     = document.getElementById('dash-interp-hum');
    if (el) {
      el.textContent = interp.texto;
      el.className   = `text-xs font-medium mt-2 ${interp.clase}`;
    }
  }

  setText('dash-hora', `Actualizado: ${new Date().toLocaleTimeString('es-AR')}`);
}
