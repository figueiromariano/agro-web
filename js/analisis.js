// ── analisis.js ───────────────────────────────────────────────────────────
// Análisis meteorológico: deltas, proyecciones, detección de patrones
// e índices agrometeorológicos.

import { estado }                                          from './firebase.js';
import { filtrarPorHoras, puntoDeRocio, vpd, estresHidrico, proyectar } from './utils.js';

// ── Detección de patrones ──────────────────────────────────────────────────
function detectarPatrones(base, dhtActual, presActual, tempActual, d3) {
  const patrones = [];

  // Helada agronómica
  if (tempActual !== null && tempActual <= 3)
    patrones.push({ nivel: 'danger',  icono: '🧊', titulo: 'Riesgo de helada',
      desc: `Temperatura ${tempActual.toFixed(1)}°C — bajo el umbral agronómico de 3°C. Riesgo alto para cultivos sensibles.` });
  else if (tempActual !== null && tempActual <= 5)
    patrones.push({ nivel: 'warning', icono: '❄️', titulo: 'Alerta de helada',
      desc: `Temperatura ${tempActual.toFixed(1)}°C — cerca del umbral. Monitorear en las próximas horas.` });

  // Tormenta inminente
  if (d3 !== null && d3 < -2 && dhtActual?.humedad > 75)
    patrones.push({ nivel: 'danger',  icono: '⛈️', titulo: 'Tormenta probable',
      desc: `Caída de ${Math.abs(d3).toFixed(1)} hPa en 3hs con humedad del ${dhtActual.humedad}% — condiciones de tormenta inminente.` });
  else if (d3 !== null && d3 < -1.5)
    patrones.push({ nivel: 'warning', icono: '🌧️', titulo: 'Frente de lluvia',
      desc: `Presión bajando ${Math.abs(d3).toFixed(1)} hPa en 3hs — posible lluvia en las próximas horas.` });

  // Niebla probable
  if (dhtActual && tempActual !== null) {
    const pr   = puntoDeRocio(tempActual, dhtActual.humedad);
    const diff = tempActual - pr;
    if (diff <= 2)
      patrones.push({ nivel: 'warning', icono: '🌫️', titulo: 'Niebla probable',
        desc: `Diferencia temp/rocío de ${diff.toFixed(1)}°C (rocío a ${pr.toFixed(1)}°C). Alta probabilidad de niebla.` });
  }

  // Sin problemas
  if (patrones.length === 0 && d3 !== null && d3 > 0 && presActual > 1010)
    patrones.push({ nivel: 'ok', icono: '☀️', titulo: 'Tiempo estable',
      desc: 'Presión en alza y sobre los 1010 hPa. Sin indicadores de mal tiempo.' });

  return patrones;
}

// ── Render ─────────────────────────────────────────────────────────────────
function renderPatron(p) {
  const bg = p.nivel === 'danger'  ? 'bg-red-900/30 border-red-700/40'
           : p.nivel === 'warning' ? 'bg-amber-900/30 border-amber-700/40'
           :                         'bg-emerald-900/30 border-emerald-700/40';
  const tc = p.nivel === 'danger'  ? 'text-red-300'
           : p.nivel === 'warning' ? 'text-amber-300'
           :                         'text-emerald-300';
  return `<div class="flex items-start gap-3 p-3 rounded-xl border ${bg}">
    <span class="text-xl mt-0.5">${p.icono}</span>
    <div>
      <p class="text-sm font-medium ${tc}">${p.titulo}</p>
      <p class="text-xs text-slate-400 mt-0.5 leading-relaxed">${p.desc}</p>
    </div>
  </div>`;
}

function barEstrés(pct) {
  const c = pct < 30 ? 'from-emerald-500 to-emerald-400'
          : pct < 60 ? 'from-amber-500 to-amber-400'
          :             'from-red-500 to-red-400';
  return `<div class="flex items-center gap-2">
    <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
      <div class="h-2 bg-gradient-to-r ${c} rounded-full" style="width:${pct.toFixed(0)}%"></div>
    </div>
    <span class="text-sm font-semibold mono ${pct < 30 ? 'text-emerald-400' : pct < 60 ? 'text-amber-400' : 'text-red-400'}">${pct.toFixed(0)}%</span>
  </div>`;
}

export function renderAnalisis() {
  const cont = document.getElementById('analisis-cont');
  if (!cont) return;

  const { bmpHist, dhtHist } = estado;
  if (bmpHist.length < 3) {
    cont.innerHTML = '<p class="text-slate-500 text-sm">Datos insuficientes. Esperando más lecturas...</p>';
    return;
  }

  const u3h  = filtrarPorHoras(bmpHist, 3);
  const u6h  = filtrarPorHoras(bmpHist, 6);
  const u12h = filtrarPorHoras(bmpHist, 12);

  function delta(arr) {
    return arr.length < 2 ? null : arr[arr.length - 1].presion - arr[0].presion;
  }
  const d3 = delta(u3h), d6 = delta(u6h), d12 = delta(u12h);

  const actual     = bmpHist[bmpHist.length - 1];
  const dhtActual  = dhtHist.length ? dhtHist[dhtHist.length - 1] : null;
  const tempActual = dhtActual?.temperatura ?? actual?.temperatura ?? null;
  const humActual  = dhtActual?.humedad ?? null;

  // Proyecciones
  const base   = u6h.length >= 4 ? u6h : bmpHist.slice(-20);
  const pres3h = proyectar(base, 'presion',     3);
  const pres6h = proyectar(base, 'presion',     6);
  const temp3h = proyectar(base, 'temperatura', 3);

  // Índices agro
  const pr   = (tempActual !== null && humActual !== null) ? puntoDeRocio(tempActual, humActual) : null;
  const vpdV = (tempActual !== null && humActual !== null) ? vpd(tempActual, humActual)          : null;
  const eh   = (tempActual !== null && humActual !== null) ? estresHidrico(tempActual, humActual) : null;

  // Patrones
  const patrones = detectarPatrones(base, dhtActual, actual?.presion, tempActual, d3);

  // Interpretación general
  let pronostico = 'Sin datos suficientes.', colorPron = 'text-slate-300', iconoPron = '☁️';
  if (d3 !== null) {
    if      (d3 < -2)  { pronostico = 'Caída rápida — alta probabilidad de lluvia próxima.';       colorPron = 'text-red-300';     iconoPron = '🌧️'; }
    else if (d3 < -1)  { pronostico = 'Presión bajando — posible lluvia en las próximas horas.';   colorPron = 'text-amber-300';   iconoPron = '🌦️'; }
    else if (d3 > 2)   { pronostico = 'Presión subiendo rápido — el tiempo tiende a mejorar.';     colorPron = 'text-emerald-300'; iconoPron = '🌤️'; }
    else if (d3 > 0.5) { pronostico = 'Presión en leve alza — tendencia a estabilizarse.';         colorPron = 'text-sky-300';     iconoPron = '⛅'; }
    else               { pronostico = 'Presión estable — sin cambios importantes a corto plazo.';  colorPron = 'text-slate-300';   iconoPron = '☁️'; }
  }
  if (humActual !== null && humActual > 80) pronostico += ' Humedad muy elevada — posible niebla.';

  const minPres = Math.min(...bmpHist.map(d => d.presion));
  const maxPres = Math.max(...bmpHist.map(d => d.presion));
  const fmtD  = v => v !== null ? (v > 0 ? '+' : '') + v.toFixed(2) + ' hPa' : '--';
  const fmtV  = (v, dec, suf) => v !== null && v !== undefined ? v.toFixed(dec) + suf : '--';
  const colorD = v => v === null ? '' : v > 0 ? 'text-emerald-400' : 'text-red-400';

  cont.innerHTML = `
    <!-- Situación actual -->
    <div class="flex items-start gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/40 mb-5">
      <span class="text-3xl">${iconoPron}</span>
      <div>
        <p class="text-xs text-slate-400 mb-1">Situación actual</p>
        <p class="${colorPron} text-sm leading-relaxed">${pronostico}</p>
      </div>
    </div>

    <!-- Variación presión -->
    <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Variación de presión</p>
    <div class="grid grid-cols-3 gap-2 mb-5">
      ${['3hs','6hs','12hs'].map((l, i) => {
        const v = [d3, d6, d12][i];
        return `<div class="bg-slate-800/60 rounded-xl p-3 border border-slate-700/40 text-center">
          <p class="text-xs text-slate-500 mb-1">Δ ${l}</p>
          <p class="text-base font-semibold mono ${colorD(v)}">${fmtD(v)}</p>
        </div>`;
      }).join('')}
    </div>

    <!-- Proyecciones -->
    <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Proyección (regresión lineal)</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
      <div class="bg-slate-800/60 rounded-xl p-3 border border-indigo-800/30">
        <p class="text-xs text-slate-500 mb-1">Presión en 3hs</p>
        <p class="text-lg font-semibold mono text-indigo-300">${pres3h !== null ? pres3h.toFixed(1) + ' hPa' : '--'}</p>
      </div>
      <div class="bg-slate-800/60 rounded-xl p-3 border border-indigo-800/30">
        <p class="text-xs text-slate-500 mb-1">Presión en 6hs</p>
        <p class="text-lg font-semibold mono text-indigo-300">${pres6h !== null ? pres6h.toFixed(1) + ' hPa' : '--'}</p>
      </div>
      <div class="bg-slate-800/60 rounded-xl p-3 border border-orange-800/30">
        <p class="text-xs text-slate-500 mb-1">Temp. en 3hs</p>
        <p class="text-lg font-semibold mono text-orange-300">${temp3h !== null ? temp3h.toFixed(1) + ' °C' : '--'}</p>
      </div>
    </div>
    <p class="text-xs text-slate-600 mb-5">⚠️ Estimaciones basadas en la tendencia reciente, no pronósticos meteorológicos.</p>

    <!-- Patrones -->
    <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Detección de patrones</p>
    <div class="space-y-2 mb-5">
      ${patrones.length ? patrones.map(renderPatron).join('') : '<p class="text-xs text-slate-500">Sin patrones críticos detectados.</p>'}
    </div>

    <!-- Índices agro -->
    <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Índices agrometeorológicos</p>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <p class="text-xs text-slate-400 mb-1">Punto de rocío</p>
        <p class="text-2xl font-semibold mono text-cyan-300">${fmtV(pr, 1, ' °C')}</p>
        <p class="text-xs text-slate-500 mt-1">${pr !== null && tempActual !== null ? 'Dif. con temp: ' + (tempActual - pr).toFixed(1) + '°C' : 'Sin datos DHT11'}</p>
      </div>
      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <p class="text-xs text-slate-400 mb-1">Déficit pres. vapor</p>
        <p class="text-2xl font-semibold mono text-violet-300">${fmtV(vpdV, 3, ' kPa')}</p>
        <p class="text-xs text-slate-500 mt-1">${vpdV !== null ? (vpdV < 0.5 ? 'Sin estrés hídrico' : vpdV < 1.5 ? 'Estrés moderado' : 'Estrés elevado') : ''}</p>
      </div>
      <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
        <p class="text-xs text-slate-400 mb-2">Índice estrés hídrico</p>
        ${eh !== null ? barEstrés(eh) + `<p class="text-xs text-slate-500 mt-2">${eh < 30 ? 'Bajo — condiciones favorables' : eh < 60 ? 'Moderado — monitorear' : 'Alto — riesgo para cultivos'}</p>` : '<p class="text-slate-500 text-sm">Sin datos DHT11</p>'}
      </div>
    </div>

    <!-- Rango presión -->
    <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/40">
      <p class="text-xs text-slate-400 mb-2">Rango de presión en el período</p>
      <div class="flex items-center gap-3">
        <span class="text-xs text-indigo-300 mono">${minPres.toFixed(1)}</span>
        <div class="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            style="width:${Math.min(100,((actual.presion-minPres)/(maxPres-minPres+0.01))*100).toFixed(0)}%"></div>
        </div>
        <span class="text-xs text-purple-300 mono">${maxPres.toFixed(1)}</span>
      </div>
      <p class="text-xs text-slate-500 mt-2 text-center">Actual: ${actual.presion.toFixed(1)} hPa</p>
    </div>
  `;
}
