import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import * as fs from "fs";

const firebaseConfigStr = fs.readFileSync("firebase-applet-config.json", "utf-8");
const firebaseConfig = JSON.parse(firebaseConfigStr);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDocs(collection(db, "tabby_tamara_complaints"));
    const snap2 = await getDocs(collection(db, "tt_complaints"));
    const snap3 = await getDocs(collection(db, "TabbyTamaraComplaint"));
    
    console.log("tabby_tamara_complaints:", snap.size);
    console.log("tt_complaints:", snap2.size);
    console.log("TabbyTamaraComplaint:", snap3.size);

    process.exit(0);
  } catch(e) {
    console.error("error", e.message);
    process.exit(1);
  }
}
run();
