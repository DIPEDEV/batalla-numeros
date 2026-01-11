// --- CONFIGURACIÓN DE FIREBASE ---
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD-kxFKykKUu5rILZXC6mZojdjfO3s7H1M",
  authDomain: "numeros-frances.firebaseapp.com",
  projectId: "numeros-frances",
  storageBucket: "numeros-frances.firebasestorage.app",
  messagingSenderId: "41447800575",
  appId: "1:41447800575:web:d379900c000a4ef15f56ca",
  measurementId: "G-H4NGZN6HML"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const db = getFirestore(app);
export const storage = getStorage(app);
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
