import { initializeApp } from "firebase/app";
import { getAuth, GithubAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDN1_tTLouMZdiuOGtuE_lJr7bnwGPLsvI",
  authDomain: "compact-af163.firebaseapp.com",
  projectId: "compact-af163",
  storageBucket: "compact-af163.firebasestorage.app",
  messagingSenderId: "755873994008",
  appId: "1:755873994008:web:706047c749612c62ff7a6d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();
