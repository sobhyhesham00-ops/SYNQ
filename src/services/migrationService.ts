import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";

export const migrateData = async () => {
  try {
    const batch = writeBatch(db);
    let migratedCount = 0;

    // 1. Migrate Inquiries
    const inqSnap = await getDocs(collection(db, "inquiries"));
    inqSnap.forEach(snapDoc => {
      const data = snapDoc.data();
      let needsUpdate = false;
      const updates: any = {};

      if (!data.workflowStatus) {
        updates.workflowStatus = data.status || "submitted";
        needsUpdate = true;
      }
      if (!data.sourceChannel) {
        updates.sourceChannel = "chat";
        needsUpdate = true;
      }

      if (Array.isArray(data.attachments)) {
        const hasLegacy = data.attachments.some((a: any) => typeof a === 'string');
        if (hasLegacy) {
          updates.attachments = data.attachments.map((a: any, i: number) => {
            if (typeof a === 'string') {
              return {
                 id: `legacy_${snapDoc.id}_${i}`,
                 name: `Legacy_Attachment_${i+1}`,
                 type: "application/octet-stream",
                 size: 0,
                 url: a // keep base64 or link
              };
            }
            return a;
          });
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        batch.update(doc(db, "inquiries", snapDoc.id), updates);
        migratedCount++;
      }
    });

    // 2. Migrate TT Requests
    const ttSnap = await getDocs(collection(db, "tt_requests"));
    ttSnap.forEach(snapDoc => {
      const data = snapDoc.data();
      let needsUpdate = false;
      const updates: any = {};

      if (!data.workflowStatus) {
        updates.workflowStatus = data.status || "not_confirmed";
        needsUpdate = true;
      }
      if (!data.sourceChannel) {
        updates.sourceChannel = "call_center";
        needsUpdate = true;
      }

      if (Array.isArray(data.attachments)) {
        const hasLegacy = data.attachments.some((a: any) => typeof a === 'string');
        if (hasLegacy) {
          updates.attachments = data.attachments.map((a: any, i: number) => {
            if (typeof a === 'string') {
              return {
                 id: `legacy_tt_${snapDoc.id}_${i}`,
                 name: `Legacy_Attachment_${i+1}`,
                 type: "application/octet-stream",
                 size: 0,
                 url: a
              };
            }
            return a;
          });
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        batch.update(doc(db, "tt_requests", snapDoc.id), updates);
        migratedCount++;
      }
    });

    if (migratedCount > 0) {
      await batch.commit();
      console.log(`Migrated ${migratedCount} documents.`);
    }

    return migratedCount;

  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
};
