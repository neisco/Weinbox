import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "./client";
import { cleanFirestoreData } from "./firestore-data";
import type { DrinkEvent, Wine } from "@/types/wine";
import { createSearchIndex, duplicateKey } from "@/lib/wine/utils";

const winesPath = (uid: string) => collection(db, "cellars", uid, "wines");
const drinksPath = (uid: string) => collection(db, "cellars", uid, "drinkEvents");

export async function fetchWines(uid: string) {
  const snap = await getDocs(query(winesPath(uid), orderBy("updatedAt", "desc"), limit(500)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as Wine);
}

export async function fetchDrinkEvents(uid: string) {
  const snap = await getDocs(query(drinksPath(uid), orderBy("consumedAt", "desc"), limit(500)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as DrinkEvent);
}

export async function upsertWine(uid: string, input: Omit<Wine, "ownerId" | "createdAt" | "updatedAt" | "searchIndex" | "status"> & { id?: string }) {
  const now = new Date().toISOString();
  const payload = {
    ...input,
    purchasePrice: input.purchasePrice ?? null,
    marketValue: input.marketValue ?? null,
    ownerId: uid,
    updatedAt: now,
    status: input.currentBottles === 0 ? "empty" : "active",
    searchIndex: createSearchIndex([input.name, input.producer, input.vintage, input.country, input.region, input.grapes, input.storageLocation])
  };

  if (input.id) {
    await setDoc(doc(winesPath(uid), input.id), cleanFirestoreData(payload), { merge: true });
    return input.id;
  }

  const key = duplicateKey(input as Wine);
  const existing = await getDocs(query(winesPath(uid), where("duplicateKey", "==", key), limit(1)));
  if (!existing.empty) {
    const existingDoc = existing.docs[0];
    await updateDoc(existingDoc.ref, cleanFirestoreData({
      currentBottles: increment(input.currentBottles),
      originalBottles: increment(input.currentBottles),
      updatedAt: now,
      status: "active"
    }));
    return existingDoc.id;
  }

  const ref = await addDoc(winesPath(uid), cleanFirestoreData({
    ...payload,
    duplicateKey: key,
    createdAt: now,
    serverUpdatedAt: serverTimestamp()
  }));
  return ref.id;
}

export async function consumeBottle(uid: string, wine: Wine, event: Omit<DrinkEvent, "ownerId" | "wineId" | "source" | "createdAt">) {
  if (!wine.id) throw new Error("Wein-ID fehlt");
  const wineRef = doc(winesPath(uid), wine.id);
  const eventRef = doc(drinksPath(uid));
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(wineRef);
    const current = Number(snap.data()?.currentBottles ?? 0);
    if (current <= 0) throw new Error("Der Bestand kann nicht negativ werden.");
    transaction.update(wineRef, cleanFirestoreData({
      currentBottles: current - 1,
      consumedBottles: increment(1),
      status: current - 1 === 0 ? "empty" : "active",
      updatedAt: new Date().toISOString()
    }));
    transaction.set(eventRef, cleanFirestoreData({
      ...event,
      ownerId: uid,
      wineId: wine.id,
      source: "cellar",
      createdAt: new Date().toISOString()
    }));
  });
}

export async function addExternalDrink(uid: string, event: Omit<DrinkEvent, "ownerId" | "source" | "createdAt">) {
  await addDoc(drinksPath(uid), cleanFirestoreData({ ...event, ownerId: uid, source: "external", createdAt: new Date().toISOString() }));
}

export async function softDeleteWine(uid: string, wineId: string) {
  await updateDoc(doc(winesPath(uid), wineId), cleanFirestoreData({ status: "deleted", deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }));
}

export async function restoreWine(uid: string, wineId: string) {
  await updateDoc(doc(winesPath(uid), wineId), cleanFirestoreData({ status: "active", deletedAt: null, updatedAt: new Date().toISOString() }));
}

export async function permanentlyDeleteWine(uid: string, wineId: string) {
  await deleteDoc(doc(winesPath(uid), wineId));
}
