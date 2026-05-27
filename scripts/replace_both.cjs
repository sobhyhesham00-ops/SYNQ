const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startTarget = `                                 if (needsGoogleAuth) {
                                    toast.info("Signing you in with Google first...");
                                    await handleGoogleLogin();
                                    return;
                                 }`;
const endTarget = `                                   const csvText = data.values.map((row: any[]) => row.map(cell => \`"\${(cell || '').toString().replace(/"/g, '""')}"\`).join(',')).join('\\n');`;

const startIdx = code.indexOf(startTarget);
const endIdx = code.indexOf(endTarget);

if (startIdx !== -1 && endIdx !== -1) {
    const fullEndIdx = endIdx + endTarget.length;
    const replaceBlock = `                                 if (!googleSheetId) return toast.error("Please provide a Google Sheets Link.");
                                 
                                 setIsSyncingSheets(true);
                                 try {
                                   const res = await fetch(\`https://docs.google.com/spreadsheets/d/\${googleSheetId}/export?format=csv\`);
                                   
                                   if (!res.ok) throw new Error("Failed to fetch public sheet. Please ensure 'Anyone with the link can view' is enabled.");
                                   const csvText = await res.text();
                                   
                                   if (!csvText || csvText.trim().length === 0) {
                                      throw new Error("No data found in the sheet.");
                                   }`;
    code = code.substring(0, startIdx) + replaceBlock + code.substring(fullEndIdx);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Replaced headcount!");
} else {
    console.log("Could not find start/end for headcount. startIdx:", startIdx, "endIdx:", endIdx);
}

const sIdx = code.indexOf(`                               if (needsGoogleAuth) {
                                  toast.info("Signing you in with Google first...");
                                  await handleGoogleLogin();
                                  return;
                               }`);

const eIdx = code.indexOf(`                                 const csvText = data.values.map((row: any[]) => row.map(cell => \`"\${(cell || '').toString().replace(/"/g, '""')}"\`).join(',')).join('\\n');`, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
    const endPartStr = `                                 const csvText = data.values.map((row: any[]) => row.map(cell => \`"\${(cell || '').toString().replace(/"/g, '""')}"\`).join(',')).join('\\n');`;
    const fullEndIdx = eIdx + endPartStr.length;
    const replaceBlock = `                               if (!googleSheetId) {
                                  toast.error("Please provide a valid Google Sheet ID or URL.");
                                  return;
                               }
                               try {
                                 setIsSyncingSheets(true);
                                 setUploadError(null);
                                 setUploadSuccess(null);
                                 
                                 const res = await fetch(\`https://docs.google.com/spreadsheets/d/\${googleSheetId}/export?format=csv\`);
                                 
                                 if (!res.ok) throw new Error("Failed to fetch public sheet. Please ensure 'Anyone with the link can view' is enabled.");
                                 const csvText = await res.text();
                                 
                                 if (!csvText || csvText.trim().length === 0) {
                                    throw new Error("No data found in the sheet.");
                                 }`;
    code = code.substring(0, sIdx) + replaceBlock + code.substring(fullEndIdx);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Replaced schedules!");
} else {
    console.log("Could not find start/end for schedules. sIdx:", sIdx, "eIdx:", eIdx);
}
