// ── utils.js ──────────────────────────────────────────────────────────────
// Funciones utilitarias compartidas entre todos los módulos.

// Parsear clave Firebase "2026-06-18_10-52-54" → Date
export function parseKey(k) {
  const [fecha, hora] = k.split('_');
  const [h, m, s]    = hora.split('-');
  const [y, mo, d]   = fecha.split('-');
  return new Date(y, mo - 1, d, h, m, s);
}

export function horasAtras(h) {
  return new Date(Date.now() - h * 3600000);
}

export function filtrarPorHoras(datos, horas) {
  const limite = horasAtras(horas);
  return datos.filter(d => d.ts >= limite);
}

export function fmtHora(d) {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

export function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

export function mostrarToast(msg, tipo = 'ok') {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = `fixed top-4 right-4 z-50 text-white text-sm px-4 py-2 rounded-lg shadow-lg pointer-events-none transition-opacity duration-300
    ${tipo === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ── Cálculos meteorológicos ────────────────────────────────────────────────

// Punto de rocío — fórmula Magnus
export function puntoDeRocio(tempC, humedadPct) {
  const a = 17.27, b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(humedadPct / 100);
  return (b * alpha) / (a - alpha);
}

// Déficit de presión de vapor (VPD) en kPa
export function vpd(tempC, humedadPct) {
  const esat = 0.6108 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  return esat * (1 - humedadPct / 100);
}

// Índice de estrés hídrico 0–100 basado en VPD
export function estresHidrico(tempC, humedadPct) {
  const v = vpd(tempC, humedadPct);
  return Math.min(100, Math.max(0, ((v - 0.5) / 1.5) * 100));
}

// Regresión lineal simple
export function regresionLineal(puntos) {
  const n = puntos.length;
  if (n < 2) return null;
  const sumX  = puntos.reduce((s, p) => s + p.x, 0);
  const sumY  = puntos.reduce((s, p) => s + p.y, 0);
  const sumXY = puntos.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = puntos.reduce((s, p) => s + p.x * p.x, 0);
  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;
  return { m, b };
}

// Proyectar campo N horas adelante usando regresión sobre datos recientes
export function proyectar(datos, campo, horasAdelante) {
  if (datos.length < 4) return null;
  const base   = datos[0].ts.getTime();
  const puntos = datos.map(d => ({ x: (d.ts.getTime() - base) / 3600000, y: d[campo] }));
  const reg    = regresionLineal(puntos);
  if (!reg) return null;
  const xFut = (datos[datos.length - 1].ts.getTime() - base) / 3600000 + horasAdelante;
  return reg.m * xFut + reg.b;
}

// Tendencia de presión para el dashboard
export function tendenciaPresion(bmpHist) {
  if (bmpHist.length < 6) return { texto: 'Sin datos suficientes', clase: 'text-gray-400', icono: '⏳' };
  const ultimos = bmpHist.slice(-12);
  const delta   = ultimos[ultimos.length - 1].presion - ultimos[0].presion;
  if (delta >  1.5) return { texto: 'Subiendo — mejora del tiempo', clase: 'text-emerald-400', icono: '📈' };
  if (delta < -1.5) return { texto: 'Bajando — posible lluvia',     clase: 'text-amber-400',   icono: '📉' };
  return { texto: 'Estable', clase: 'text-sky-400', icono: '➡️' };
}

export function interpretarHumedad(h) {
  if (h >= 80) return { texto: 'Muy húmedo', clase: 'text-blue-400' };
  if (h >= 65) return { texto: 'Húmedo',     clase: 'text-sky-400' };
  if (h >= 40) return { texto: 'Normal',     clase: 'text-emerald-400' };
  return           { texto: 'Seco',          clase: 'text-amber-400' };
}
