import { db } from "../firebase";
import { collection, getDocs, writeBatch } from "firebase/firestore";

export const purgeAllTimeLogs = async (isSuperAdmin: boolean): Promise<number> => {
  if (!isSuperAdmin) {
    throw new Error("Unauthorized: Only Super Administrators can purge logs.");
  }

  let deletedCount = 0;
  const snapshot = await getDocs(collection(db, "timelogs"));
  const docs = snapshot.docs;
  
  if (docs.length === 0) {
    return 0;
  }

  const batchSize = 450;
  for (let i = 0; i < docs.length; i += batchSize) {
    const chunk = docs.slice(i, i + batchSize);
    const batch = writeBatch(db);
    chunk.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
    deletedCount += chunk.length;
  }

  return deletedCount;
};
