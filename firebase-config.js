// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBNb5eOXQyGJEImUmFdTf1CDMrSvjo5Cr8",
  authDomain: "trabalho-faculdade-85d9f.firebaseapp.com",
  projectId: "trabalho-faculdade-85d9f",
  storageBucket: "trabalho-faculdade-85d9f.firebasestorage.app",
  messagingSenderId: "529348366136",
  appId: "1:529348366136:web:0d741b2259a08704f77bcd",
  measurementId: "G-PX7VB80P72"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);