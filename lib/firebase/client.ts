import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

function getClientApp(): FirebaseApp {
  if (getApps().length) return getApp();
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "NEXT_PUBLIC_FIREBASE_API_KEY is not set. Add it to .env.local or enable DEMO_MODE."
    );
  }
  return initializeApp({
    apiKey,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  });
}

const app = getClientApp();

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
