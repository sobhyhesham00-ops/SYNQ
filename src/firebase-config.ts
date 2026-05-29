import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer, Firestore } from "firebase/firestore";

// Get configuration from import.meta.env for Vite React app
const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN,
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// Robust initialization checking to prevent errors if variables are missing
try {
  if (!firebaseConfig.projectId || firebaseConfig.projectId === "your_firebase_project_id") {
    console.warn("⚠️ Firebase is not properly configured. Check your .env.local file.");
  } else {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Failed to initialize Firebase app:", error);
}

/**
 * Tests the connection to Firestore to detect offline/missing permission errors.
 * Useful for debugging and offline mode fallback mechanisms.
 */
export async function testConnection(): Promise<boolean> {
  if (!db) {
    console.warn("Firestore is not initialized. Connection test skipped.");
    return false;
  }

  try {
    // Attempting to fetch a status document to test connectivity
    await getDocFromServer(doc(db, "system", "status"));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firebase Client is offline. Running in offline/fallback mode.");
      return false;
    } else if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
       // This indicates we connected, but access was denied (which means online)
      return true;
    }
    console.error("Firebase Connection Error:", error);
    return false;
  }
}

// Optionally call test connection at startup to establish network status
if (db) {
  testConnection();
}

/**
 * Gets the Database reference, throwing a helpful error if it hasn't mapped yet.
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error("Firestore was not initialized. Please configure your .env.local variables.");
  }
  return db;
}

export { app, db };
