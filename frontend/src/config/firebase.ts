// Firebase configuration for CitasPro
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validar configuración
if (!firebaseConfig.apiKey) {
  throw new Error('VITE_FIREBASE_API_KEY no está configurada. Agrega las variables de Firebase en el archivo .env');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set language to Spanish
auth.languageCode = 'es';

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
