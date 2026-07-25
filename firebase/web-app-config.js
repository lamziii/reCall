// Recall's Firebase web app config. Not a secret — safe to commit and to use directly in
// frontend code. Copy this into frontend/src/lib/firebase.js (or .ts) once the frontend is
// scaffolded, alongside `npm i firebase`.
//
// Analytics is left commented out: it needs a real browser + consent flow and isn't needed
// for the app's core features. Uncomment getAnalytics/analytics below if you want it later.

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCyJdoW4zT6d-xaucU9u7cNt4RHsmTzF9I",
  authDomain: "recall-ca1ec.firebaseapp.com",
  projectId: "recall-ca1ec",
  storageBucket: "recall-ca1ec.firebasestorage.app",
  messagingSenderId: "164858424265",
  appId: "1:164858424265:web:d1fe1c791d74f9d0895618",
  measurementId: "G-GWSH9Q6QB2",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
// export const analytics = getAnalytics(app);
