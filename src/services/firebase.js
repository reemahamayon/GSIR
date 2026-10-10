// src/services/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDgt6ywe1aqipqxh0U_-2O31-Xp6e31j_0",
  authDomain: "gsir-c5254.firebaseapp.com",
  projectId: "gsir-c5254",
  storageBucket: "gsir-c5254.firebasestorage.app",
  messagingSenderId: "995359527797",
  appId: "1:995359527797:web:7bddcdd0a25e808ec1b93c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;