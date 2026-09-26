"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser } from "firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { onAuthStateChangedListener, signOutUser } from "@/lib/firebase/auth";
import { subscribeUserDoc } from "@/lib/firebase/firestore";
import { UserDoc } from "@/types";

interface AuthContextValue {
  firebaseUser: FirebaseUser | null;
  userDoc: UserDoc | null;
  loading: boolean;
  firebaseConfigured: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  userDoc: null,
  loading: true,
  firebaseConfigured: false,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebaseConfigured = isFirebaseConfigured();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userDoc, setUserDoc] = useState<UserDoc | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userDocLoading, setUserDocLoading] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChangedListener((user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, [firebaseConfigured]);

  useEffect(() => {
    if (!firebaseUser) {
      setUserDoc(null);
      return;
    }
    setUserDocLoading(true);
    const unsubscribe = subscribeUserDoc(firebaseUser.uid, (doc) => {
      setUserDoc(doc);
      setUserDocLoading(false);
    });
    return unsubscribe;
  }, [firebaseUser]);

  const value: AuthContextValue = {
    firebaseUser,
    userDoc,
    loading: authLoading || (Boolean(firebaseUser) && userDocLoading && !userDoc),
    firebaseConfigured,
    signOut: signOutUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
