import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  enableMultiTabIndexedDbPersistence, 
  initializeFirestore, 
  Firestore,
  collection,
  onSnapshot,
  query,
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// 1. Firebase config with environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

// Initialize Firebase
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  // 3. Authentication setup
  auth = getAuth(app);

  // 2. Firestore initialization
  // We use initializeFirestore instead of getFirestore to ensure custom settings
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

  // 5. Error handling for offline mode
  enableMultiTabIndexedDbPersistence(db).catch((err: any) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore persistence failed: Multiple tabs open. Persistence works only in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firestore persistence failed: Your browser does not support local storage capabilities needed for offline mode.');
    } else {
      console.error('Firestore offline persistence error:', err);
    }
  });
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { app, db, auth };

// 4. Real-time listener setup for schedules
export interface ScheduleItem {
  id: string;
  [key: string]: any;
}

export const subscribeToSchedules = (
  callback: (schedules: ScheduleItem[]) => void,
  errorCallback?: (error: Error) => void,
  ...queryConstraints: QueryConstraint[]
): Unsubscribe => {
  try {
    const schedulesRef = collection(db, 'schedules');
    const q = query(schedulesRef, ...queryConstraints);
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const schedules: ScheduleItem[] = [];
        snapshot.forEach((doc) => {
          schedules.push({ id: doc.id, ...doc.data() } as ScheduleItem);
        });
        callback(schedules);
      },
      (error) => {
        console.error("Error fetching real-time schedules:", error);
        if (errorCallback) {
          errorCallback(error);
        }
      }
    );
    return unsubscribe;
  } catch (error: any) {
    console.error("Error setting up schedules listener:", error);
    if (errorCallback) {
      errorCallback(error);
    }
    // Return a dummy unsubscribe function if initialization failed
    return () => {};
  }
};
