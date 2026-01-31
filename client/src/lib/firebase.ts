import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, OAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "data-rag-15105.firebaseapp.com",
  projectId: "data-rag-15105",
  storageBucket: "data-rag-15105.firebasestorage.app",
  messagingSenderId: "970301425740",
  appId: "1:970301425740:web:08317f16b6ddb99c5a0ce9",
  measurementId: "G-5B9SVRN65N"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const microsoftProvider = new OAuthProvider('microsoft.com');
