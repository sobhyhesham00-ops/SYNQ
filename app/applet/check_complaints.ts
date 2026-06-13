import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// Read config from file or just extract from src/firebase.ts
import { db } from "./src/firebase";

async function run() {
  try {
    const snap = await getDocs(collection(db, "tabby_tamara_complaints"));
    const arr = snap.docs.map(d => d.data());
    
    console.log("[complaints] total docs from Firestore:", arr.length, "createdAt values:", arr.map((c) => c.createdAt));
    
    // Mimic the cutoff check
    const getCutoffTime = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const cutoff = new Date(currentYear, currentMonth - 1, 17, 0, 0, 0, 0);
        return cutoff.getTime();
    };
    const cutoff = getCutoffTime();
    
    const filtered = arr.filter((item) => {
        if (!item.createdAt) return true;
        const t = new Date(item.createdAt).getTime();
        if (isNaN(t)) return true;
        return t >= cutoff;
    });
    console.log("[complaints] after cutoff filter:", filtered.length, "cutoff was:", new Date(cutoff).toISOString());
  } catch(e) {
    console.error("error:", e);
  }
}
run();
