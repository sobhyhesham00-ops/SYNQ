const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `{/* Drag & Drop Board */}`;
const targetIndex = code.indexOf(target1);
if (targetIndex === -1) {
    console.error("target1 not found");
    process.exit(1);
}

const endDivPart = `          Format: Agent Name, Date (YYYY-MM-DD), Shift\n                        </span>\n                      </div>`;
const endIndex = code.indexOf(endDivPart, targetIndex);
if (endIndex === -1) {
    console.error("end div not found");
    process.exit(1);
}
const fullEndIndex = endIndex + endDivPart.length;

let innerBlock = code.substring(targetIndex, fullEndIndex);

const sheetExtractor = `
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-center transition-all min-h-[220px]">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shadow-inner">
                          <svg className="w-6 h-6 bg-white rounded-full p-0.5" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">Import via Google Sheets Link</p>
                          <p className="text-xs text-emerald-300 mt-1">Extract schedules directly from a linked Google Sheet</p>
                        </div>
                        <div className="w-full mt-2 space-y-2">
                           <input
                             type="text"
                             placeholder="Paste Google Sheets Link..."
                             value={googleSheetId}
                             onChange={(e) => {
                                let val = e.target.value;
                                const match = val.match(/\\/d\\/([a-zA-Z0-9-_]+)/);
                                if (match) val = match[1];
                                setGoogleSheetId(val);
                                setStorageItem('sched_google_sheet_id', val);
                             }}
                             className="bg-white/5 backdrop-blur-xl border border-white/10 text-white placeholder-emerald-500/50 text-xs rounded-lg px-3 py-2.5 w-full focus:outline-none focus:border-emerald-500 text-center"
                           />
                           <button
                             onClick={async () => {
                               if (needsGoogleAuth) {
                                  toast.info("Signing you in with Google first...");
                                  await handleGoogleLogin();
                                  return;
                               }
                               if (!googleSheetId) {
                                 toast.error("Please provide a valid Google Sheet ID or URL.");
                                 return;
                               }
                               try {
                                 setIsSyncingSheets(true);
                                 setUploadError(null);
                                 setUploadSuccess(null);
                                 
                                 const ts = getStorageItem('sched_g_t');
                                 
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
                                 
                                 const csvText = data.values.map((row: any[]) => row.map(cell => \`"\${(cell || '').toString().replace(/"/g, '""')}"\`).join(',')).join('\\n');
                                 
                                 const result = parseScheduleCSV(csvText);
                                 if (result.errors.length > 0) {
                                    setUploadError(result.errors.join('\\n'));
                                 }
                                 if (result.schedules.length > 0) {
                                    const newAgentsList: string[] = [];
                                    const oldAgentsSet = new Set(agentsList.map(a => a.toLowerCase()));
                                    result.schedules.forEach(s => {
                                       if (!oldAgentsSet.has(s.agentName.toLowerCase()) && !newAgentsList.some(n => n.toLowerCase() === s.agentName.toLowerCase())) {
                                          newAgentsList.push(s.agentName);
                                       }
                                    });
                                    setTempNewAgents(newAgentsList);
                                    setTempSchedules(result.schedules);
                                    setUploadSuccess(\`Successfully extracted \${result.schedules.length} shifts spanning \${new Set(result.schedules.map(r => r.date)).size} days.\`);
                                 } else {
                                    setUploadError((prev) => (prev ? prev + "\\n" : "") + "No schedule data parsed from sheet.");
                                 }
                               } catch (err: any) {
                                 setUploadError("Extraction failed: " + err.message);
                               } finally {
                                 setIsSyncingSheets(false);
                               }
                             }}
                             disabled={isSyncingSheets}
                             className={\`w-full py-2 text-center \${isSyncingSheets ? 'bg-emerald-500/50' : 'bg-emerald-500 hover:bg-emerald-600'} text-white rounded-lg font-bold text-xs uppercase tracking-widest cursor-pointer shadow-lg transition-all\`}
                           >
                             {isSyncingSheets ? 'Extracting...' : 'Extract From Sheet'}
                           </button>
                        </div>
                      </div>
`;

innerBlock = `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">\n` + innerBlock + sheetExtractor + `</div>`;

code = code.substring(0, targetIndex) + innerBlock + code.substring(fullEndIndex);
fs.writeFileSync('src/App.tsx', code);
console.log("Written!");
