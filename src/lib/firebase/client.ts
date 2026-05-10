import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const fallbackConfig: FirebaseOptions = {
  apiKey: "missing-firebase-api-key",
  authDomain: "missing-firebase-auth-domain.firebaseapp.com",
  projectId: "missing-firebase-project-id",
  storageBucket: "missing-firebase-project-id.appspot.com",
  messagingSenderId: "000000000000",
  appId: "missing-firebase-app-id"
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = getApps().length ? getApps()[0] : initializeApp(isFirebaseConfigured ? firebaseConfig : fallbackConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

let persistencePromise: Promise<void> | null = null;

export function assertFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase ist noch nicht konfiguriert. Bitte fülle .env.local mit den NEXT_PUBLIC_FIREBASE_* Werten aus .env.example.");
  }
}

export function enableOfflinePersistence() {
  if (typeof window === "undefined" || !isFirebaseConfigured) return Promise.resolve();
  if (!persistencePromise) {
    persistencePromise = enableIndexedDbPersistence(db).catch((error: { code?: string }) => {
      if (error.code === "failed-precondition" || error.code === "unimplemented") return;
      throw error;
    });
  }
  return persistencePromise;
}
