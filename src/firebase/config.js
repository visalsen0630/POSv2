import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAn0BRBc1_IeHWOiqEU4Czz2_ze8Ixa8tY",
  authDomain: "angor-pos.firebaseapp.com",
  projectId: "angor-pos",
  storageBucket: "angor-pos.firebasestorage.app",
  messagingSenderId: "578268196059",
  appId: "1:578268196059:web:948061d44a0d2dbf0db0fe",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
