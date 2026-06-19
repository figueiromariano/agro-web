// ── firebase.js ───────────────────────────────────────────────────────────
// Inicialización de Firebase y estado global compartido entre módulos.
// Importar este archivo primero en index.html.

import { initializeApp }   from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getDatabase, ref, onValue, query, orderByKey, limitToLast, get }
  from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyBL1CD_ht63zpzhr1-PvD7ZEPr2ppYH49c",
  authDomain:        "agro-campo-a9633.firebaseapp.com",
  databaseURL:       "https://agro-campo-a9633-default-rtdb.firebaseio.com",
  projectId:         "agro-campo-a9633",
  storageBucket:     "agro-campo-a9633.firebasestorage.app",
  messagingSenderId: "934726239483",
  appId:             "1:934726239483:web:541fb59e8f6f0ee0471c5e"
};

export const app = initializeApp(firebaseConfig);
export const db  = getDatabase(app);
export { ref, onValue, query, orderByKey, limitToLast, get };

// ── Estado global ──────────────────────────────────────────────────────────
// Todos los módulos leen y escriben acá. No duplicar estado en cada archivo.

export const estado = {
  bmpHist:    [],   // { ts: Date, presion, temperatura, altitud }
  dhtHist:    [],   // { ts: Date, temperatura, humedad }
  ultimoBmp:  null,
  ultimoDht:  null,
};
