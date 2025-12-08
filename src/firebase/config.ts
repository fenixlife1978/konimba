import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tu configuración actual de Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyB6OQZvVklwXyjL0Zy1pcO8JwQvi2jfvH0",
  authDomain: "studio-1531665135-d603d.firebaseapp.com",
  projectId: "studio-1531665135-d603d",
  storageBucket: "studio-1531665135-d603d.firebasestorage.app",
  messagingSenderId: "892376341822",
  appId: "1:892376341822:web:9913567e474fa7eb2aa06f"
};

// 1. Inicialización Única de la Aplicación
// Esto previene errores de re-inicialización si la función se llama varias veces.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Exportar los Servicios (Módulos)
// Exportamos las instancias de los servicios que probablemente necesitarás.
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app); // Descomenta si usas Cloud Storage

export default app;
