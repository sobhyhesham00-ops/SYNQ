const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace standard avatar update
code = code.replace(
  /setCurrentUser\(\{\.\.\.currentUser, avatarUrl: newUrl\}\);\n(?:.*?)setStorageItem\('sched_current_user', \{\.\.\.currentUser, avatarUrl: newUrl\}\);/s,
  `setCurrentUser({...currentUser, avatarUrl: newUrl});
                                setStorageItem('sched_current_user', {...currentUser, avatarUrl: newUrl});
                                setDoc(doc(db, "users", currentUser.name.toLowerCase().replace(/[^a-z0-9]/g, '')), { name: currentUser.name, role: currentUser.role, avatarUrl: newUrl, lastUpdated: Date.now() }, { merge: true }).catch(console.error);`
);

// Replace todo local changes
code = code.replace(
  /const next = \[newItem, \.\.\.todos\];\n(?:.*?)setTodos\(next\);\n(?:.*?)setStorageItem\('agent_todos', next\);/s,
  `setDoc(doc(db, "todos", newItem.id), newItem).catch(console.error);`
);

code = code.replace(
  /let done = false;\n(?:.*?)const next = todos\.map\(x => \{\n(?:.*?)(if \(x\.id === t\.id\) \{ done = !x\.isCompleted; return \{\.\.\.x, isCompleted: done\}; \})\n(?:.*?)return x;\n(?:.*?)\}\);\n(?:.*?)setTodos\(next\); setStorageItem\('agent_todos', next\);/s,
  `const done = !t.isCompleted;
                                  updateDoc(doc(db, "todos", t.id), { isCompleted: done }).catch(console.error);`
);

code = code.replace(
  /const next = todos\.filter\(x => x\.id !== t\.id\);\n(?:.*?)setTodos\(next\); setStorageItem\('agent_todos', next\);/s,
  `deleteDoc(doc(db, "todos", t.id)).catch(console.error);`
);

// We should also replace the login handle to sync role if needed, but not strictly necessary.

fs.writeFileSync('src/App.tsx', code);
console.log('Firebase writes added for profile and todos');
