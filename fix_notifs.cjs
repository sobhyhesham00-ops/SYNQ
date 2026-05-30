const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

// I will now add setDoc call to addSystemNotification
// First, import setDoc from firebase/firestore if not there, wait it might be.
// Let's just fix addSystemNotification.

code = code.replace(
  `    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      setStorageItem('sched_notifications', updated);
      return updated;
    });`,
  `    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      setStorageItem('sched_notifications', updated);
      return updated;
    });
    // Write to firestore notification collection directly
    try {
      const docRef = window._firebaseDoc ? window._firebaseDoc(window._firebaseDb, "notifications", newNotif.id) : null;
      if (docRef && window._firebaseSetDoc) {
        window._firebaseSetDoc(docRef, newNotif).catch(e => console.error("Firebase Notif Error", e));
      }
    } catch(e) {}
`
);

fs.writeFileSync(p, code);
