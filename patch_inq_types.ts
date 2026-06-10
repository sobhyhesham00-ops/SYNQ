import * as fs from "fs";
const file = "src/App.tsx";
let content = fs.readFileSync(file, "utf8");

content = content.replace(/inq\.screenshot/g, "(inq as any).screenshot");
content = content.replace(/inq\.imageUrl/g, "(inq as any).imageUrl");
content = content.replace(/inq\.attachmentsObjects/g, "(inq as any).attachmentsObjects");

fs.writeFileSync(file, content);
