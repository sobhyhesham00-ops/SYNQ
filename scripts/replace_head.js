const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `                                 if (needsGoogleAuth) {
                                    toast.info("Signing you in with Google first...");
                                    await handleGoogleLogin();
                                    return;
                                 }
                                 if (!googleSheetId) return toast.error("Please provide a Google Sheets Link.");
                                 
                                 setIsSyncingSheets(true);
                                 try {
                                   const ts = await getAccessToken();
                                   if (!ts) throw new Error("No token. Please sign in again.");
                                   
                                   // Fetch to get exact sheet name
                                   const metaRes = await fetch(\`https://sheets.googleapis.com/v4/spreadsheets/\${googleSheetId}\`, {
                                      headers: { Authorization: \`Bearer \${ts}\` }
                                   });
                                   if (!metaRes.ok) throw new Error(await metaRes.text());
                                   const metaData = await metaRes.json();
                                   const sheetName = metaData.sheets?.[0]?.properties?.title || 'Sheet1';
                                   
                                   const res = await fetch(\`https://sheets.googleapis.com/v4/spreadsheets/\${googleSheetId}/values/'\${sheetName}'!A1:Z\`, {
                                      headers: { Authorization: \`Bearer \${ts}\` }
                                   });
                                   
                                   if (!res.ok) throw new Error(await res.text());
                                   const data = await res.json();
                                   
                                   if (!data.values || data.values.length < 2) {
                                      throw new Error("No data found in the sheet.");
                                   }
                                   
                                   const csvText = data.values.map((row: any[]) => row.map((cell: any) => \`"\${(cell || '').toString().replace(/"/g, '""')}"\`).join(',')).join('\\n');`;

const replaceStr = `                                 if (!googleSheetId) return toast.error("Please provide a Google Sheets Link.");
                                 
                                 setIsSyncingSheets(true);
                                 try {
                                   const res = await fetch(\`https://docs.google.com/spreadsheets/d/\${googleSheetId}/export?format=csv\`);
                                   
                                   if (!res.ok) throw new Error("Failed to fetch public sheet. Please ensure 'Anyone with the link can view' is enabled.");
                                   const csvText = await res.text();
                                   
                                   if (!csvText || csvText.trim().length === 0) {
                                      throw new Error("No data found in the sheet.");
                                   }`;

if(code.indexOf(targetStr) !== -1) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Success");
} else {
    console.log("Target string not found.");
}
