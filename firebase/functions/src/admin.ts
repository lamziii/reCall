import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

if (getApps().length === 0) {
  initializeApp();
}

export const db = getFirestore();

/** Default Cloud Storage bucket — used to read large recordings the browser uploaded out-of-band
 *  (a single HTTP request body can't exceed ~32MB, so multi-hour recordings arrive via Storage). */
export const bucket = getStorage().bucket();
