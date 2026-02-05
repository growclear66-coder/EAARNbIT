import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCmJV-JHdd3hFUdJMPYMQsTtClEZnKvQkk",
  authDomain: "earnbit-64290.firebaseapp.com",
  projectId: "earnbit-64290",
  storageBucket: "earnbit-64290.firebasestorage.app",
  messagingSenderId: "5691971968",
  appId: "1:5691971968:web:310cc5dbbc971e30020965",
  measurementId: "G-8Q31SM8HDG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);