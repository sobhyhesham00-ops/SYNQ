const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Minimal firebase config using the current settings assuming firebase-applet-config.json exists
const fs = require('fs');

async function migrate() {
    const firebaseConfigPath = 'firebase-applet-config.json';
    if (!fs.existsSync(firebaseConfigPath)) return;
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    const app = initializeApp(config);
    const db = getFirestore(app);

    const admins = [
        ["h.sobhy", "hesham sobhy", "hesso"],
        ["a.hassan", "amira hassan", "amira"],
        ["shaymaa hassan", "s.hassan", "shymaa hassan"],
        ["sobhyhesham00@gmail.com"]
    ];

    for (const names of admins) {
        for (const username of names) {
            const uid = `usr_${username.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`;
            console.log("Migrating:", username, "->", uid);
            // Write each normalized alias to firestore
            await setDoc(doc(db, "users", uid), {
                id: uid,
                name: username,
                role: "director"
            }, { merge: true });
            
            // Also write exact username as doc id (as prompt suggested)
            await setDoc(doc(db, "users", username), {
                id: uid,
                name: username,
                role: "director"
            }, { merge: true });
        }
    }
    
    console.log("Migration Complete");
    process.exit(0);
}

migrate();
