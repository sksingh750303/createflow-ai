import "server-only";

// Firebase Admin SDK — server-only. Never import this file from a Client
// Component or anything bundled into the browser; it holds the service
// account private key and has elevated privileges (bypasses Firestore/
// Storage security rules entirely).

import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";
import { Storage, getStorage } from "firebase-admin/storage";

export function isFirebaseAdminConfigured() {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

let adminApp: App | null = null;

function getAdminApp(): App {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, " +
        "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see .env.example). " +
        "Generate these from a Firebase service account — Project Settings " +
        "→ Service Accounts → Generate new private key."
    );
  }
  if (!adminApp) {
    adminApp = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Private keys are usually stored in .env with literal "\n" —
            // convert them back to real newlines.
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
  }
  return adminApp;
}

let authAdmin: Auth | null = null;
let dbAdmin: Firestore | null = null;
let storageAdmin: Storage | null = null;

export function getAdminAuth(): Auth {
  if (!authAdmin) authAdmin = getAuth(getAdminApp());
  return authAdmin;
}

export function getAdminDb(): Firestore {
  if (!dbAdmin) dbAdmin = getFirestore(getAdminApp());
  return dbAdmin;
}

export function getAdminStorage(): Storage {
  if (!storageAdmin) storageAdmin = getStorage(getAdminApp());
  return storageAdmin;
}
