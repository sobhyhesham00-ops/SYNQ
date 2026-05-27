const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add users and todos to state and snapshot
const stateHooks = `  const [todos, setTodos] = useState<any[]>(() => getStorageItem('agent_todos', []));`;
const snapshotInjection = `
    const unsubTodos = onSnapshot(collection(db, "todos"), snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTodos(data);
      setStorageItem('agent_todos', data);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), snap => {
      const dbUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // We will merge db users with currentUser to maintain live avatars
      setAgentsList(prev => {
         const allNames = new Set([...prev, ...dbUsers.map(u => u.name)]);
         return Array.from(allNames);
      });
      // Optionally update currentUser if their document was updated
      setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const liveUserInfo = dbUsers.find(u => u.name.toLowerCase() === prevUser.name.toLowerCase());
        if (liveUserInfo) {
           return { ...prevUser, ...liveUserInfo };
        }
        return prevUser;
      });
    });

    return () => {
`;

code = code.replace(/    return \(\) => \{/, snapshotInjection + `      unsubTodos();\n      unsubUsers();\n`);

fs.writeFileSync('src/App.tsx', code);
console.log('Firebase sync hooks added');
