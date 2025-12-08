import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Tu configuración de Firebase, exportada para que otros módulos puedan acceder a ella si es necesario.
export const firebaseConfig = {
  apiKey: "AIzaSyB6OQZvVklwXyjL0Zy1pcO8JwQvi2jfvH0",
  authDomain: "studio-1531665135-d603d.firebaseapp.com",
  projectId: "studio-1531665135-d603d",
  storageBucket: "studio-1531665135-d603d.firebasestorage.app",
  messagingSenderId: "892376341822",
  appId: "1:892376341822:web:9913567e474fa7eb2aa06f"
};

// 1. Inicialización Única de la Aplicación
// Esto previene el error "Firebase App named '[DEFAULT]' already exists" en Next.js.
// Se usa getApps().length para verificar si ya existe una instancia.
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// 2. Exportar los Servicios (Módulos)
// Exportamos las instancias de los servicios para un uso modular en toda la aplicación.
export const auth = getAuth(app);
export const db = getFirestore(app);
// export const storage = getStorage(app); // Descomenta si usas Cloud Storage

// Se elimina la exportación por defecto (export default app;) 
// para forzar el uso de exportaciones nombradas, lo que mejora la claridad y el bundling.