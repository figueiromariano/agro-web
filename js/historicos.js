// ── historicos.js ─────────────────────────────────────────────────────────
// Gráficos históricos de presión, temperatura y humedad.

import { estado }              from './firebase.js';
import { filtrarPorHoras, fmtHora } from './utils.js';

let chartPres    = null;
let chartTempHum = null;

const CHART_DEFAULTS = {
  responsive:          true,
  maintainAspectRatio: false,
  interaction:         { mode: 'index', intersect: false },
  plugins:             { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
};

const GRID_COLOR  = 'rgba(255,255,255,0.05)';
const TICK_COLOR  = '#64748b';

export function buildChartPresion(horas) {
  const datos  = filtrarPorHoras(estado.bmpHist, horas);
  const labels = datos.map(d => fmtHora(d.ts));

  const ctx = document.getElementById('chartPresion');
  if (!ctx) return;
  if (chartPres) chartPres.destroy();

  chartPres = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label:           'Presión (hPa)',
          data:            datos.map(d => d.presion),
          borderColor:     '#818cf8',
          backgroundColor: 'rgba(129,140,248,0.10)',
          borderWidth: 2, pointRadius: 2, tension: 0.4,
          fill: true, yAxisID: 'yPres'
        },
        {
          label:       'Temperatura BMP (°C)',
          data:        datos.map(d => d.temperatura),
          borderColor: '#fb923c',
          borderDash:  [4, 3],
          borderWidth: 2, pointRadius: 1.5, tension: 0.4,
          fill: false, yAxisID: 'yTemp'
        }
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x:     { ticks: { color: TICK_COLOR, maxTicksLimit: 10, font: { size: 10 } }, grid: { color: GRID_COLOR } },
        yPres: { position: 'left',  ticks: { color: '#818cf8', font: { size: 10 } }, grid: { color: GRID_COLOR }, title: { display: true, text: 'hPa', color: '#818cf8', font: { size: 10 } } },
        yTemp: { position: 'right', ticks: { color: '#fb923c', font: { size: 10 } }, grid: { display: false },    title: { display: true, text: '°C',  color: '#fb923c', font: { size: 10 } } }
      }
    }
  });
}

export function buildChartTempHum(horas) {
  const datosBmp = filtrarPorHoras(estado.bmpHist, horas);
  const datosDht = filtrarPorHoras(estado.dhtHist, horas);
  const labels   = datosDht.map(d => fmtHora(d.ts));

  const ctx = document.getElementById('chartTempHum');
  if (!ctx) return;
  if (chartTempHum) chartTempHum.destroy();

  chartTempHum = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label:       'Temp DHT11 (°C)',
          data:        datosDht.map(d => d.temperatura),
          borderColor: '#f472b6',
          borderWidth: 2, pointRadius: 1.5, tension: 0.4,
          fill: false, yAxisID: 'yTemp'
        },
        {
          label:       'Temp BMP180 (°C)',
          data:        datosDht.map(dd => {
            const match = datosBmp.find(b => Math.abs(b.ts - dd.ts) < 6 * 60000);
            return match ? match.temperatura : null;
          }),
          borderColor: '#fb923c',
          borderDash:  [4, 3],
          borderWidth: 2, pointRadius: 1.5, tension: 0.4,
          fill: false, yAxisID: 'yTemp', spanGaps: true
        },
        {
          label:       'Humedad DHT11 (%)',
          data:        datosDht.map(d => d.humedad),
          borderColor: '#34d399',
          borderWidth: 2, pointRadius: 1.5, tension: 0.4,
          fill: false, yAxisID: 'yHum'
        }
      ]
    },
    options: {
      ...CHART_DEFAULTS,
      scales: {
        x:    { ticks: { color: TICK_COLOR, maxTicksLimit: 10, font: { size: 10 } }, grid: { color: GRID_COLOR } },
        yTemp: { position: 'left',  ticks: { color: '#f472b6', font: { size: 10 } }, grid: { color: GRID_COLOR }, title: { display: true, text: '°C', color: '#f472b6', font: { size: 10 } } },
        yHum:  { position: 'right', ticks: { color: '#34d399', font: { size: 10 } }, grid: { display: false },   title: { display: true, text: '%',  color: '#34d399', font: { size: 10 } }, min: 0, max: 100 }
      }
    }
  });
}

export function actualizarHistoricos(horas) {
  buildChartPresion(horas);
  buildChartTempHum(horas);
}
