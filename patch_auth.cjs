const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add userRoles state
const stateSearch = 'const [authReady, setAuthReady] = useState<boolean>(false);';
const stateReplace = `const [authReady, setAuthReady] = useState<boolean>(false);

  // User Roles reference map mapping username -> Role
  const [userRoles, setUserRoles] = useState<Record<string, Role>>({});

  useEffect(() => {
    if (!authReady) return;
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const rolesMap: Record<string, Role> = {};
      snapshot.docs.forEach(doc => {
        const u = doc.data();
        if (u.role) {
            if (u.name) rolesMap[u.name.toLowerCase()] = u.role;
            if (u.id) rolesMap[u.id.toLowerCase()] = u.role;
            rolesMap[doc.id.toLowerCase()] = u.role;
        }
      });
      setUserRoles(rolesMap);
    }, (error) => {
      console.error("Error fetching user roles:", error);
    });
    return () => unsub();
  }, [authReady]);`;
code = code.replace(stateSearch, stateReplace);

// 2. Modify isSuperAdmin regex safely
code = code.replace(/const isSuperAdmin = currentUser\s*\?[^\;]*\;/m, 'const isSuperAdmin = currentUser?.role === "director";');

// 3. Modify isAdminUser inside handleLoginSubmit
code = code.replace(/const isAdminUser =([\s\S]*?);/m, 
    `const isAdminUser =
      userRoles[formattedUsername] === "director" ||
      userRoles[matchedFullName?.toLowerCase() || ""] === "director" ||
      formattedUsername === "h.sobhy" ||
      formattedUsername === "hesso" ||
      formattedUsername === "a.hassan" ||
      formattedUsername.includes("amira") ||
      formattedUsername.includes("hesham") ||
      formattedUsername === "amira hassan" ||
      formattedUsername.includes("sobhy");`);

// 4. Modify handleLoginSubmit role logic 1
let handleSearch1 = `const userRole = isQAName(correspondingFullName)
      ? "qa"
      : isTLName(correspondingFullName)
        ? "tl"
        : "agent";`;
        
let handleReplace1 = `const persistedRole = userRoles[formattedUsername] || userRoles[correspondingFullName.toLowerCase().replace(/\\s+/g, '.')];
    const userRole = persistedRole || (isQAName(correspondingFullName) ? "qa" : isTLName(correspondingFullName) ? "tl" : "agent");
    console.log("[AUTH] Logged in as:", correspondingFullName, "| Persisted role:", persistedRole, "| Final role:", userRole, "| isSuperAdmin:", userRole === "director");`;

code = code.replace(handleSearch1, handleReplace1);
code = code.replace(handleSearch1, handleReplace1); // there are two instances (login and signup)

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
