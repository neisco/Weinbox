"use client";

import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { assertFirebaseConfigured, auth, db, enableOfflinePersistence, googleProvider, isFirebaseConfigured } from "./client";
import type { UserProfile } from "@/types/wine";

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return undefined;
    }

    void enableOfflinePersistence();
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setError(null);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "users", nextUser.uid);
        const snap = await getDoc(ref);
        const now = new Date().toISOString();
        if (!snap.exists()) {
          const newProfile: UserProfile = {
            uid: nextUser.uid,
            email: nextUser.email,
            displayName: nextUser.displayName,
            photoURL: nextUser.photoURL,
            role: "user",
            disabled: false,
            onboarded: false,
            createdAt: now
          };
          await setDoc(ref, { ...newProfile, serverCreatedAt: serverTimestamp() });
          setProfile(newProfile);
        } else {
          setProfile(snap.data() as UserProfile);
        }
      } catch (authError) {
        setError(authError instanceof Error ? authError.message : "Dein Profil konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return { user, profile, loading, error, isConfigured: isFirebaseConfigured };
}

export async function loginWithGoogle() {
  assertFirebaseConfigured();
  await signInWithPopup(auth, googleProvider);
}

export async function logout() {
  assertFirebaseConfigured();
  await signOut(auth);
}
