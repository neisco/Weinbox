import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "./client";
import { UserProfile } from "@/types/wine";

export type Invitation = {
  id?: string;
  email?: string;
  token: string;
  status: "open" | "used" | "revoked";
  createdAt: string;
};

export async function fetchUsers() {
  const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
  return snap.docs.map((item) => ({ uid: item.id, ...item.data() }) as UserProfile);
}

export async function createInvitation(email?: string) {
  const token = crypto.randomUUID();
  const invite: Invitation = { email, token, status: "open", createdAt: new Date().toISOString() };
  await addDoc(collection(db, "invites"), invite);
  return `${window.location.origin}?invite=${token}`;
}

export async function setUserDisabled(uid: string, disabled: boolean) {
  await updateDoc(doc(db, "users", uid), { disabled });
}

export async function deleteUserProfile(uid: string) {
  await deleteDoc(doc(db, "users", uid));
}
