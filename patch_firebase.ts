import * as fs from "fs";
const file = "src/firebase.ts";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /const firebaseConfig = \{.*?\};\n\n\/\/ Perform strict configuration validation\nconst requiredKeys: \(keyof typeof firebaseConfig\)\[\] = \["apiKey", "projectId", "appId"\];\nfor \(const key of requiredKeys\) \{\n  if \(\!firebaseConfig\[key\]\) \{\n    throw new Error\(\n      `Firebase config validation error: missing critical schema field "\$\{key\}". Please configure VITE_FIREBASE_\$\{key\.toUpperCase\(\)\.replace\(\/\(\[a-z\]\)\(\[A-Z\]\)\/g, "\$1_\$2"\)\} or check firebase-applet-config\.json\.`\n    \);\n  \}\n\}/s,
  \`const safeGet = (envVal: any, fallback: string) =>
  (!envVal || envVal === 'undefined' || envVal === '') ? fallback : envVal;

const firebaseConfig = {
  apiKey:            safeGet((import.meta as any).env.VITE_FIREBASE_API_KEY,              firebaseConfigFromJson.apiKey),
  authDomain:        safeGet((import.meta as any).env.VITE_FIREBASE_AUTH_DOMAIN,          firebaseConfigFromJson.authDomain),
  projectId:         safeGet((import.meta as any).env.VITE_FIREBASE_PROJECT_ID,           firebaseConfigFromJson.projectId),
  firestoreDatabaseId: safeGet((import.meta as any).env.VITE_FIREBASE_DATABASE_ID,       firebaseConfigFromJson.firestoreDatabaseId),
  storageBucket:     safeGet((import.meta as any).env.VITE_FIREBASE_STORAGE_BUCKET,       firebaseConfigFromJson.storageBucket),
  messagingSenderId: safeGet((import.meta as any).env.VITE_FIREBASE_MESSAGING_SENDER_ID,  firebaseConfigFromJson.messagingSenderId),
  appId:             safeGet((import.meta as any).env.VITE_FIREBASE_APP_ID,               firebaseConfigFromJson.appId),
  measurementId:     safeGet((import.meta as any).env.VITE_FIREBASE_MEASUREMENT_ID,       firebaseConfigFromJson.measurementId || ''),
};

// Perform strict configuration validation
const requiredKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'projectId', 'appId'];
requiredKeys.forEach(key => {
  if (!firebaseConfig[key] || firebaseConfig[key] === 'undefined') {
    console.warn(
      \\\`[Firebase] Config warning: "\\\${key}" is missing or invalid. \\\` +
      \\\`Check environment variables or firebase-applet-config.json. \\\` +
      \\\`Falling back to JSON config: \\\${firebaseConfigFromJson[key as keyof typeof firebaseConfigFromJson] ? 'OK' : 'ALSO MISSING'}\\\`
    );
  }
});\`
);

fs.writeFileSync(file, content);
