const fs = require('fs');
const p = require('path').join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

// Ensure setDoc, updateDoc, deleteDoc are imported
if (!code.includes('setDoc')) {
  code = code.replace(/import { doc, onSnapshot, collection } from 'firebase\/firestore';/, "import { doc, onSnapshot, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';");
}

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
    
    // Auto-sync real-time to firestore
    try {
      setDoc(doc(db, "notifications", newNotif.id), newNotif).catch(e=>console.error("Notif Error", e));
    } catch(e) {}`
);

fs.writeFileSync(p, code);
console.log('Fixed Notifs');
