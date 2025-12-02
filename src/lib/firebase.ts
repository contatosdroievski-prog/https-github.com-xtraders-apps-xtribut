import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB9yJzA2imAFsUjYGF7S7HzTA3kPNf6P7o",
  authDomain: "calculadora-ir-56a2c.firebaseapp.com",
  projectId: "calculadora-ir-56a2c",
  storageBucket: "calculadora-ir-56a2c.appspot.com",
  messagingSenderId: "613402077853",
  appId: "1:613402077853:web:244d838cc2a99452288274"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
