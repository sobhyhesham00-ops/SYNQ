import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  onSnapshot as firestoreOnSnapshot,
  setDoc as firestoreSetDoc,
  updateDoc as firestoreUpdateDoc,
  deleteDoc as firestoreDeleteDoc,
  addDoc as firestoreAddDoc,
  getDocs as firestoreGetDocs,
  getDoc as firestoreGetDoc,
  connectFirestoreEmulator,
  memoryLocalCache,
} from "firebase/firestore";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  connectAuthEmulator,
  signInAnonymously,
} from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import firebaseConfigFromJson from "../firebase-applet-config.json";

// 1. Load Firebase configuration from environment with startup validation & json fallback
const getConfig = (envVar: string, jsonFallback: string) =>
  (import.meta as any).env[envVar] &&
  (import.meta as any).env[envVar] !== "undefined"
    ? (import.meta as any).env[envVar]
    : jsonFallback;

const firebaseConfig = {
  apiKey: getConfig("VITE_FIREBASE_API_KEY", firebaseConfigFromJson.apiKey),
  authDomain: getConfig(
    "VITE_FIREBASE_AUTH_DOMAIN",
    firebaseConfigFromJson.authDomain,
  ),
  projectId: getConfig(
    "VITE_FIREBASE_PROJECT_ID",
    firebaseConfigFromJson.projectId,
  ),
  firestoreDatabaseId: getConfig(
    "VITE_FIREBASE_DATABASE_ID",
    firebaseConfigFromJson.firestoreDatabaseId,
  ),
  storageBucket: getConfig(
    "VITE_FIREBASE_STORAGE_BUCKET",
    firebaseConfigFromJson.storageBucket,
  ),
  messagingSenderId: getConfig(
    "VITE_FIREBASE_MESSAGING_SENDER_ID",
    firebaseConfigFromJson.messagingSenderId,
  ),
  appId: getConfig("VITE_FIREBASE_APP_ID", firebaseConfigFromJson.appId),
  measurementId: getConfig(
    "VITE_FIREBASE_MEASUREMENT_ID",
    firebaseConfigFromJson.measurementId || "",
  ),
};

// Perform strict configuration validation
const requiredKeys: (keyof typeof firebaseConfig)[] = [
  "apiKey",
  "projectId",
  "appId",
];
for (const key of requiredKeys) {
  if (!firebaseConfig[key]) {
    console.error(
      `Firebase config validation error: missing critical schema field "${key}". Please configure VITE_FIREBASE_${key.toUpperCase().replace(/([a-z])([A-Z])/g, "$1_$2")} or check firebase-applet-config.json.`,
    );
  }
}

const isFirstInit = !getApps().length;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();
const isTestEnv =
  typeof process !== "undefined" && process.env.NODE_ENV === "test";

// Handle HMR safely
export const db = isFirstInit 
  ? initializeFirestore(
      app,
      {
        ignoreUndefinedProperties: true,
        localCache: memoryLocalCache(),
      },
      firebaseConfig.firestoreDatabaseId
    )
  : getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export const ensureAuth = async () => {
  try {
    if (!auth.currentUser) {
      console.log("[Firebase Auth] Attempting anonymous sign-in...");
      const credential = await signInAnonymously(auth);
      console.log(
        "[Firebase Auth] Anonymous sign-in matched/success:",
        credential.user.uid,
      );
      return credential.user;
    }
    return auth.currentUser;
  } catch (error) {
    console.error("[Firebase Auth] Anonymous sign-in failed:", error);
    return null;
  }
};
export const storage = getStorage(app);

// Enable Emulator Suite globally in local environment
export const useEmulator =
  (import.meta as any).env.VITE_USE_EMULATOR === "true" ||
  ((import.meta as any).env.DEV && window.location.hostname === "localhost");



if (useEmulator) {
  console.log(
    "[Firebase Emulator] Local emulation active. Connecting to emulators...",
  );
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log(
      "[Firebase Emulator] Successfully initialized Auth, Firestore, and Storage emulators.",
    );
  } catch (err) {
    console.warn(
      "[Firebase Emulator] Connection error (it may already be initialized):",
      err,
    );
  }
}

// Deterministic mock seed data function
export async function seedEmulatorDatabase() {
  if (!useEmulator) return;
  console.log("[Firebase Emulator] Seeding roles and credentials...");
  try {
    const { doc, writeBatch } = await import("firebase/firestore");
    const batch = writeBatch(db);

    // 1. Credentials Document
    const credRef = doc(db, "system", "credentials");
    batch.set(credRef, {
      "h.sobhy": "Password123",
      "a.hassan": "Password123",
      "s.hassan": "Password123",
      "b.rabea": "Password123",
      "a.sayed": "Password123",
      "j.mohamed": "Password123",
    });

    // 2. Support Assignments Document
    const suppRef = doc(db, "system", "sched_support_assignments");
    batch.set(suppRef, {
      data: {
        "Jodie El Sayed Mohamed Mohamed": {
          assignedBy: "Hesham Sobhy",
          assignedAt: new Date().toISOString(),
        },
      },
    });

    // 3. User lists profiles seed
    const users = [
      { id: "usr_superadmin", name: "Hesham Sobhy", role: "tl" },
      { id: "usr_director", name: "Amira Hassan", role: "tl" },
      { id: "usr_tl", name: "Shymaa Hassan", role: "tl" },
      { id: "usr_qa", name: "Basma Rabea", role: "qa" },
      { id: "usr_agent", name: "AbdelRahman Al Sayed", role: "agent" },
      {
        id: "usr_support",
        name: "Jodie El Sayed Mohamed Mohamed",
        role: "agent",
      },
    ];

    for (const u of users) {
      const uRef = doc(
        db,
        "users",
        u.name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase(),
      );
      batch.set(uRef, u);
    }

    await batch.commit();
    console.log(
      "[Firebase Emulator] Local deterministic seed data published successfully.",
    );
  } catch (error) {
    console.error("[Firebase Emulator] Error during auto-seeding:", error);
  }
}

// Auto-run seeding if using emulator
if (useEmulator) {
  seedEmulatorDatabase();
}

// Simulated/stubbed auth methods based on what App.tsx expects if we want Google sign-in
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://www.googleapis.com/auth/calendar");
googleProvider.addScope("https://www.googleapis.com/auth/drive.file");
googleProvider.addScope(
  "https://www.googleapis.com/auth/drive.metadata.readonly",
);

// Cache the access token in memory as recommended by the Workspace skill.
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onSuccess: (user: any, token: string | null) => void,
  onFail: () => void,
) => {
  return auth.onAuthStateChanged(async (user) => {
    if (user) {
      // If we already have a cached Workspace token, use it.
      // Otherwise, the user might need to sign in again to get a fresh Workspace token.
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // We don't have a Workspace access token yet, so we notify failure
        // which usually triggers a "Sign in with Google" button in the UI.
        onFail();
      }
    } else {
      cachedAccessToken = null;
      onFail();
    }
  });
};

export const googleSignIn = async () => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async () => {
  return cachedAccessToken;
};

export const logout = async () => {
  cachedAccessToken = null;
  return await signOut(auth);
};

// --- Firestore Hardened Error Interceptor ---

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));

  // Only throw if it is a write/update operation to prevent unhandled background exceptions on asynchronous read/list snapshots
  if (
    operationType === OperationType.CREATE ||
    operationType === OperationType.UPDATE ||
    operationType === OperationType.DELETE ||
    operationType === OperationType.WRITE
  ) {
    throw new Error(JSON.stringify(errInfo));
  }
}

// Helper to extract a path string from any document / collection reference or query
function getReferencePath(ref: any): string | null {
  if (!ref) return null;
  if (typeof ref.path === "string") return ref.path;
  if (ref._query && ref._query.path && typeof ref._query.path.toString === "function") {
    return ref._query.path.toString();
  }
  if (ref.query && ref.query._query && ref.query._query.path && typeof ref.query._query.path.toString === "function") {
    return ref.query._query.path.toString();
  }
  if (ref.query && typeof ref.query.path === "string") return ref.query.path;
  if (typeof ref.toString === "function" && ref.toString() !== "[object Object]") {
    return ref.toString();
  }
  return "unknown_query";
}

export function wrappedOnSnapshot(ref: any, ...args: any[]) {
  const path = getReferencePath(ref);
  const currentUid = auth.currentUser?.uid;
  console.log(
    `[Firestore onSnapshot] Attaching real-time listener for path [${path}]. Current Auth UID: ${currentUid || "unauthenticated"}`,
  );

  let nextCb: any = null;
  let errorCb: any = null;
  let options: any = null;

  if (typeof args[0] === "function") {
    nextCb = args[0];
    errorCb = args[1];
  } else if (typeof args[0] === "object" && typeof args[1] === "function") {
    options = args[0];
    nextCb = args[1];
    errorCb = args[2];
  }

  const wrappedNext = (snapshot: any) => {
    if (nextCb) {
      try {
        nextCb(snapshot);
      } catch (err) {
        console.error("Error in onSnapshot next callback:", err);
      }
    }
  };

  const wrappedError = (error: any) => {
    if (errorCb) {
      try {
        errorCb(error);
      } catch (err) {
        console.error("Error in user-provided onSnapshot error handler:", err);
      }
    }
    handleFirestoreError(error, OperationType.GET, path);
  };

  if (options) {
    return firestoreOnSnapshot(ref, options, wrappedNext, wrappedError);
  } else {
    return firestoreOnSnapshot(ref, wrappedNext, wrappedError);
  }
}

export async function wrappedSetDoc(ref: any, data: any, options?: any) {
  const path = getReferencePath(ref);
  try {
    if (options) {
      return await firestoreSetDoc(ref, data, options);
    } else {
      return await firestoreSetDoc(ref, data);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function wrappedUpdateDoc(ref: any, ...args: any[]) {
  const path = getReferencePath(ref);
  try {
    return await (firestoreUpdateDoc as any)(ref, ...args);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function wrappedDeleteDoc(ref: any) {
  const path = getReferencePath(ref);
  try {
    return await firestoreDeleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function wrappedAddDoc(ref: any, data: any) {
  const path = getReferencePath(ref);
  try {
    return await firestoreAddDoc(ref, data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function wrappedGetDocs(ref: any) {
  const path = getReferencePath(ref);
  try {
    return await firestoreGetDocs(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

export async function wrappedGetDoc(ref: any) {
  const path = getReferencePath(ref);
  try {
    return await firestoreGetDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}
