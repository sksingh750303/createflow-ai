"use client";

// Firebase client SDK — safe to import from Client Components only.
// Never import this from a Server Component, API route, or anywhere that
// needs the Admin SDK's elevated privileges (see lib/firebase/admin.ts).

import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  Auth,
  GoogleAuthProvider,
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

function getApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add NEXT_PUBLIC_FIREBASE_* env vars (see .env.example)."
    );
  }
  if (!app) {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getApp());
    // Persist the session across tabs/reloads (this is UI-session
    // convenience, not authoritative data — Firebase itself is the
    // source of truth for the session token).
    setPersistence(authInstance, browserLocalPersistence).catch(() => {
      // Ignore — falls back to Firebase's default persistence.
    });
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(getApp());
  }
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storageInstance) {
    storageInstance = getStorage(getApp());
  }
  return storageInstance;
}

export const googleAuthProvider = new GoogleAuthProvider();
