import { initializeApp } from "firebase/app";
// 🔴 CAMBIO AQUÍ: Importamos la versión MultiTab
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBhPNE_MBuofjgsDNGNWKt8CBtBAKZfQCc",
  authDomain: "panel-de-control-intelig-db278.firebaseapp.com",
  projectId: "panel-de-control-intelig-db278",
  storageBucket: "panel-de-control-intelig-db278.firebasestorage.app",
  messagingSenderId: "950669155809",
  appId: "1:950669155809:web:f49085e386dacb6a0446a0"
};

// App principal (La que usas tú para navegar)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// App Secundaria (La Fábrica silenciosa que crea a tus clientes)
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
export const secondaryAuth = getAuth(secondaryApp);

// 🔴 NUEVO: MULTI-TAB PERSISTENCE (Adiós al error de pantalla roja)
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Múltiples pestañas abiertas, pero el navegador no soporta sincronización completa.');
  } else if (err.code === 'unimplemented') {
    console.warn('El navegador actual no soporta el modo offline.');
  }
});