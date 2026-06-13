const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `const unsubComp = onSnapshot(
        collection(db, "tabby_tamara_complaints"),
        (snap) => {
          const arr = snap.docs.map(d => ({...d.data(), id: d.id}) as any);`;

const replacement = `const unsubComp = onSnapshot(
        collection(db, "tabby_tamara_complaints"),
        (snap) => {
          const arr = snap.docs.map(d => {
            const data = d.data();
            if (!data.patientName || !data.phoneNumber || !data.complaintDetails || !data.clinicName || !data.createdAt || !data.status) {
                console.warn("[TabbyTamaraComplaint] Missing required fields in doc " + d.id + ":", data);
            }
            return {...data, id: d.id};
          }) as any;`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
console.log('Runtime check added to App.tsx');
