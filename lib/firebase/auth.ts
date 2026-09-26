"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, googleAuthProvider } from "@/lib/firebase/client";
import { createUserDocIfMissing } from "@/lib/firebase/firestore";

export function onAuthStateChangedListener(cb: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(getFirebaseAuth(), cb);
}

/** Fires whenever the ID token refreshes — use this if you need to re-sync a token used elsewhere. */
export function onIdTokenChangedListener(cb: (user: FirebaseUser | null) => void) {
  return onIdTokenChanged(getFirebaseAuth(), cb);
}

export async function signUpWithEmail(name: string, email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) {
    await updateProfile(cred.user, { displayName: name });
  }
  // Firestore user doc + free-plan starting credits are created here,
  // client-side, immediately after signup for a snappy first paint — the
  // authoritative copy is re-asserted server-side the first time any
  // /api/ai/* route runs (see lib/api/ensure-user.ts), so a client that
  // skips this step (or a malicious client that tries to write bogus
  // credits) can't get free credits it isn't entitled to.
  await createUserDocIfMissing(cred.user);
  await sendEmailVerification(cred.user).catch(() => {
    // Non-fatal — the user can request another verification email later.
  });
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const auth = getFirebaseAuth();
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  const cred = await signInWithPopup(auth, googleAuthProvider);
  await createUserDocIfMissing(cred.user);
  return cred.user;
}

export async function signOutUser() {
  await signOut(getFirebaseAuth());
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(getFirebaseAuth(), email);
}

export async function resendVerificationEmail() {
  const user = getFirebaseAuth().currentUser;
  if (user) await sendEmailVerification(user);
}

/** Gets a fresh Firebase ID token to attach to API requests as a Bearer token. */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return null;
  return user.getIdToken(forceRefresh);
}
