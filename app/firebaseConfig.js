// app/firebaseConfig.js

// Importera Firebase SDK-funktioner
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Din Firebase-konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyAfVfjBodi9vkO3_N4tYqceBcfDyx9bXZM",
  authDomain: "skiftappen.firebaseapp.com",
  projectId: "skiftappen",
  storageBucket: "skiftappen.firebasestorage.app",
  messagingSenderId: "189333127323",
  appId: "1:189333127323:web:9dcf8f7c4fea0efc19463e"
};

// Initiera Firebase
const app = initializeApp(firebaseConfig);

// Exportera auth så det kan användas i andra filer
export const auth = getAuth(app);
export default app;
