import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

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
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  });
}

export const auth = new Proxy({} as Auth, {
  get(_t, prop) {
    return (getAuth(getClientApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const db = new Proxy({} as Firestore, {
  get(_t, prop) {
    return (getFirestore(getClientApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const storage = new Proxy({} as FirebaseStorage, {
  get(_t, prop) {
    return (getStorage(getClientApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});
