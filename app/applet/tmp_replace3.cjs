const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `      const unsubComp = onSnapshot(
        collection(db, "tabby_tamara_complaints"),
        (snap) => {
          const arr = snap.docs.map(d => ({...d.data(), id: d.id}) as any);
          const cutoff = getCutoffTime();
          const filtered = arr.filter((item) => {`;

const replacement = `      const unsubComp = onSnapshot(
        collection(db, "tabby_tamara_complaints"),
        (snap) => {
          const arr = snap.docs.map(d => ({...d.data(), id: d.id}) as any);
          console.log("[complaints] total docs from Firestore:", arr.length, "createdAt values:", arr.map((c) => c.createdAt));
          const cutoff = getCutoffTime();
          const filtered = arr.filter((item) => {`;

content = content.replace(target, replacement);

const target2 = `            if (isNaN(t)) return true;
            return t >= cutoff;
          });
          filtered.sort(`;

const replacement2 = `            if (isNaN(t)) return true;
            return t >= cutoff;
          });
          console.log("[complaints] after cutoff filter:", filtered.length, "cutoff was:", new Date(cutoff).toISOString());
          filtered.sort(`;

content = content.replace(target2, replacement2);

fs.writeFileSync('src/App.tsx', content);
