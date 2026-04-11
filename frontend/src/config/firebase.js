// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBP14F3SLz-g-GfMEs_jUAw9zzaqAXXeSY",
  authDomain: "ahmed-992a1.firebaseapp.com",
  databaseURL: "https://ahmed-992a1-default-rtdb.firebaseio.com",
  projectId: "ahmed-992a1",
  storageBucket: "ahmed-992a1.firebasestorage.app",
  messagingSenderId: "285988835095",
  appId: "1:285988835095:web:401edb17c4509f8098b152",
  measurementId: "G-KGYR5YVYVG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics };