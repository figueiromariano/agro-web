// ── alertas.js ────────────────────────────────────────────────────────────
// Gestión de alertas y umbrales configurables.

import { estado }        from './firebase.js';
import { mostrarToast }  from './utils.js';

// Umbrales por defecto — se sobreescriben con lo guardado en localStorage
export let umbrales = JSON.parse(localStorage.getItem('umbrales') || 'null') || {
  presion_min: 990,  presion_max: 1020,
  temp_min:    0,    temp_max:    40,
  humedad_min: 20,   humedad_max: 85,
};

let alertasActivas = [];

// ── Verificar umbrales con los datos actuales ──────────────────────────────
export function verificarAlertas() {
  const { ultimoBmp, ultimoDht } = estado;
  alertasActivas = [];

  if (ultimoBmp) {
    if (ultimoBmp.presion    < umbrales.presion_min) alertasActivas.push({ tipo: 'danger',  msg: `Presión baja: ${ultimoBmp.presion.toFixed(1)} hPa (mín ${umbrales.presion_min})` });
    if (ultimoBmp.presion    > umbrales.presion_max) alertasActivas.push({ tipo: 'warning', msg: `Presión alta: ${ultimoBmp.presion.toFixed(1)} hPa (máx ${umbrales.presion_max})` });
    if (ultimoBmp.temperatura < umbrales.temp_min)   alertasActivas.push({ tipo: 'danger',  msg: `Temperatura baja: ${ultimoBmp.temperatura.toFixed(1)}°C (mín ${umbrales.temp_min})` });
    if (ultimoBmp.temperatura > umbrales.temp_max)   alertasActivas.push({ tipo: 'danger',  msg: `Temperatura alta: ${ultimoBmp.temperatura.toFixed(1)}°C (máx ${umbrales.temp_max})` });
  }
  if (ultimoDht) {
    if (ultimoDht.humedad < umbrales.humedad_min) alertasActivas.push({ tipo: 'warning', msg: `Humedad baja: ${ultimoDht.humedad}% (mín ${umbrales.humedad_min})` });
    if (ultimoDht.humedad > umbrales.humedad_max) alertasActivas.push({ tipo: 'danger',  msg: `Humedad alta: ${ultimoDht.humedad}% (máx ${umbrales.humedad_max})` });
  }

  renderAlertas();
  actualizarBadge();
}

// ── Render lista de alertas ────────────────────────────────────────────────
export function renderAlertas() {
  const cont = document.getElementById('alertas-lista');
  if (!cont) return;

  if (alertasActivas.length === 0) {
    cont.innerHTML = `<div class="flex items-center gap-3 p-4 rounded-xl bg-emerald-900/30 border border-emerald-700/40">
      <span class="text-2xl">✅</span>
      <span class="text-emerald-300 text-sm">Todo dentro de los umbrales configurados.</span>
    </div>`;
    return;
  }

  cont.innerHTML = alertasActivas.map(a => `
    <div class="flex items-start gap-3 p-4 rounded-xl ${a.tipo === 'danger'
      ? 'bg-red-900/30 border border-red-700/40'
      : 'bg-amber-900/30 border border-amber-700/40'}">
      <span class="text-xl">${a.tipo === 'danger' ? '🚨' : '⚠️'}</span>
      <span class="${a.tipo === 'danger' ? 'text-red-300' : 'text-amber-300'} text-sm">${a.msg}</span>
    </div>`).join('');
}

function actualizarBadge() {
  const badge = document.getElementById('badge-alertas');
  if (!badge) return;
  if (alertasActivas.length > 0) {
    badge.textContent = alertasActivas.length;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// ── Guardar umbrales desde el formulario ──────────────────────────────────
export function guardarUmbrales() {
  umbrales = {
    presion_min: parseFloat(document.getElementById('u-pres-min').value),
    presion_max: parseFloat(document.getElementById('u-pres-max').value),
    temp_min:    parseFloat(document.getElementById('u-temp-min').value),
    temp_max:    parseFloat(document.getElementById('u-temp-max').value),
    humedad_min: parseFloat(document.getElementById('u-hum-min').value),
    humedad_max: parseFloat(document.getElementById('u-hum-max').value),
  };
  localStorage.setItem('umbrales', JSON.stringify(umbrales));
  verificarAlertas();
  mostrarToast('Umbrales guardados ✓');
}

// ── Poblar formulario con valores actuales ─────────────────────────────────
export function initFormUmbrales() {
  document.getElementById('u-pres-min').value = umbrales.presion_min;
  document.getElementById('u-pres-max').value = umbrales.presion_max;
  document.getElementById('u-temp-min').value = umbrales.temp_min;
  document.getElementById('u-temp-max').value = umbrales.temp_max;
  document.getElementById('u-hum-min').value  = umbrales.humedad_min;
  document.getElementById('u-hum-max').value  = umbrales.humedad_max;
  document.getElementById('btn-guardar-umbrales')?.addEventListener('click', guardarUmbrales);
}
