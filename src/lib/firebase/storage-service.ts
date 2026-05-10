import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./client";

export const MAX_IMAGE_BYTES = 1_200_000;

export async function uploadWineImage(uid: string, wineId: string, file: File) {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Das Bild ist zu gross. Maximal 1.2 MB sind erlaubt.");
  const extension = file.type === "image/webp" ? "webp" : "jpg";
  const imageRef = ref(storage, `users/${uid}/wine-labels/${wineId}.${extension}`);
  await uploadBytes(imageRef, file, { contentType: file.type || "image/jpeg", cacheControl: "public,max-age=31536000" });
  return getDownloadURL(imageRef);
}

export async function deleteWineImage(path: string) {
  await deleteObject(ref(storage, path));
}
