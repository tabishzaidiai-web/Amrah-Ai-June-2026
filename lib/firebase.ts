import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Use a self-executing function to ensure strictly ordered initialization
const app: FirebaseApp = (() => {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
})();

// Initialize services immediately after app core
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

export default app;
