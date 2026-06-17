const FIREBASE_DATABASE_URL = "https://agro-campo-a9633-default-rtdb.firebaseio.com/";
const FIREBASE_API_KEY = "AIzaSyBL1CD_ht63zpzhr1-PvD7ZEPr2ppYH49c";

async function obtenerToken() {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true })
  });
  const data = await response.json();
  return data.idToken;
}

async function leerFirebase(ruta) {
  const token = await obtenerToken();
  const url = `${FIREBASE_DATABASE_URL}${ruta}.json?auth=${token}`;
  const response = await fetch(url);
  return await response.json();
}

function formatearHora(timestamp) {
  if (!timestamp || timestamp === "-") return "Sin datos";
  return `Ultima lectura: ${timestamp}`;
}

async function actualizarDatos() {
  try {
    const dht11 = await leerFirebase("sensores/dht11/ultima_lectura");
    if (dht11) {
      document.getElementById("temp-valor").textContent = dht11.temperatura ?? "--";
      document.getElementById("hum-valor").textContent = dht11.humedad ?? "--";
      document.getElementById("dht11-timestamp").textContent = formatearHora(dht11.timestamp);
    }

    const bmp180 = await leerFirebase("sensores/bmp180/ultima_lectura");
    if (bmp180) {
      document.getElementById("presion-valor").textContent = bmp180.presion ?? "--";
      document.getElementById("bmp-temp-valor").textContent = bmp180.temperatura ?? "--";
      document.getElementById("altitud-valor").textContent = bmp180.altitud ?? "--";
      document.getElementById("bmp180-timestamp").textContent = formatearHora(bmp180.timestamp);
    } else {
      document.getElementById("bmp180-timestamp").textContent = "Sensor no conectado";
      document.getElementById("bmp180-timestamp").classList.add("sin-datos");
    }

    const estado = await leerFirebase("dispositivos/dht11_esp32/estado");
    if (estado) {
      document.getElementById("estado-nombre").textContent = estado.nombre ?? "--";
      document.getElementById("estado-modo").textContent = estado.modo ?? "--";
      document.getElementById("estado-red").textContent = estado.red ?? "--";
    }

    const ahora = new Date().toLocaleTimeString("es-AR");
    document.getElementById("ultima-actualizacion").textContent = `Actualizado: ${ahora}`;

  } catch (error) {
    console.error("Error al obtener datos:", error);
    document.getElementById("ultima-actualizacion").textContent = "Error de conexion";
  }
}

actualizarDatos();
setInterval(actualizarDatos, 30000);
