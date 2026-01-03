// Firebase configuration for CitasPro
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDTvI29IbiY7mKFEe89YthlOREtcReDjh4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "citaspro-58dd6.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "citaspro-58dd6",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "citaspro-58dd6.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "685046800124",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:685046800124:web:9c7911fe8ed86255a28179"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set language to Spanish
auth.languageCode = 'es';

export { auth, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
