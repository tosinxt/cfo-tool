import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getStorage, type Storage } from "firebase-admin/storage";

function getAdminApp(): App {
  if (getApps().length) return getApps()[0];

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Add it to .env.local or enable DEMO_MODE."
    );
  }

  const serviceAccount = JSON.parse(json);

  return initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

// Lazy proxies — Firebase Admin is only initialised when a method is first called.
// This lets DEMO_MODE routes short-circuit before the SDK is ever touched.

export const adminDb = new Proxy({} as Firestore, {
  get(_t, prop) {
    return (getFirestore(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminAuth = new Proxy({} as Auth, {
  get(_t, prop) {
    return (getAuth(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const adminStorage = new Proxy({} as Storage, {
  get(_t, prop) {
    return (getStorage(getAdminApp()) as unknown as Record<string | symbol, unknown>)[prop];
  },
});
