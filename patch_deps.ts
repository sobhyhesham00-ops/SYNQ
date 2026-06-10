import * as fs from "fs";

const file = "src/App.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(
  /if \(liveUserInfo\) \{\n\s+return \{ \.\.\.prevUser, \.\.\.liveUserInfo \};\n\s+\}/s,
  `if (liveUserInfo) {
          const isSame = Object.keys(liveUserInfo).every(
            (key) => JSON.stringify((liveUserInfo as any)[key]) === JSON.stringify((prevUser as any)[key])
          );
          if (!isSame) {
            return { ...prevUser, ...liveUserInfo };
          }
        }`
);

// We should also look at the dependency arrays!
content = content.replace(
  /useEffect\(\(\) => \{\n\s+if \(\!currentUser \|\| \!currentUser\.id\) return;\n\n\s+\/\/ 1\. Schedules Real-time Sync[\s\S]*?\}, \[currentUser\]\);/s,
  (match) => {
    return match.replace("}, [currentUser]);", "}, [currentUser?.id, currentUser?.role]);");
  }
);

content = content.replace(
  /useEffect\(\(\) => \{\n\s+const unsub = auth\.onAuthStateChanged\(\(user\) => \{\n\s+if \(user && currentUser\) \{\n\s+setDoc\(doc\(db, "users", user\.uid\)[\s\S]*?\}, \[currentUser\]\);/s,
  (match) => {
    return match.replace("}, [currentUser]);", "}, [currentUser?.id, currentUser?.role, currentUser?.name]);");
  }
);

content = content.replace(
  /useEffect\(\(\) => \{\n\s+if \(currentUser\) \{\n\s+setActiveTab\("dashboard"\);\n\s+\}\n\s+\}, \[currentUser\]\);/s,
  (match) => {
    // Only run this once when currentUser starts existing.
    return match.replace("}, [currentUser]);", "}, [currentUser?.id]);");
  }
);

content = content.replace(
  /useEffect\(\(\) => \{\n\s+currentUserRef\.current = currentUser;\n\s+if \(currentUser\) \{\n\s+setStorageItem\("sched_current_user", currentUser\);\n\s+\} else \{\n\s+localStorage\.removeItem\("sched_current_user"\);\n\s+\}\n\s+\}, \[currentUser\]\);/s,
  (match) => {
    // This one actually cares about mapping all properties to localStorage, so we'll leave it but let's stringify
    return match.replace("}, [currentUser]);", "}, [JSON.stringify(currentUser)]);");
  }
);

fs.writeFileSync(file, content);
