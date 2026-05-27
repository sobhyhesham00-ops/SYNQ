const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

const startIdx1 = lines.findIndex(l => l.includes('{/* CSV Schedule Uploader Section */}'));
let endIdx1 = -1;
if (startIdx1 !== -1) {
  for (let i = startIdx1; i < lines.length; i++) {
    if (lines[i].includes('{/* Roster Live Toggle Switch purely for Hesham & Amira */}')) {
      endIdx1 = i;
      break;
    }
  }
}

const startIdx2 = lines.findIndex(l => l.includes('{/* Direct Schedule Upload Panel for Amira Hassan & Hesham Sobhy */}'));
let endIdx2 = -1;
if (startIdx2 !== -1) {
  for (let i = startIdx2; i < lines.length; i++) {
    if (lines[i].includes('{/* Manual Single-Shift Roster Submission Form */}')) {
      endIdx2 = i;
      break;
    }
  }
}

if (startIdx1 !== -1 && endIdx1 !== -1 && startIdx2 !== -1 && endIdx2 !== -1) {
    const component = `                  {/* Unified Modern Roster Upload Console */}
                  {isSuperAdmin && (
                    <div className="bg-white border text-left border-gray-200 rounded-3xl p-8 shadow-sm space-y-8 animate-fade-in relative">
                      {isSyncingSheets && (
                        <div className="absolute inset-0 z-50 bg-white/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
                           <div className="p-4 bg-white shadow-xl rounded-2xl flex items-center gap-3 border border-gray-100">
                             <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                             <span className="text-sm font-bold text-gray-900">Uploading and Processing Roster...</span>
                           </div>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-5 gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                            <Upload className="w-5 h-5 text-indigo-500" />
                            Schedule Roster Upload
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            Upload a spreadsheet containing agent shifts. Supports <b>.xlsx, .xls, .csv</b>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={downloadScheduleTemplate}
                            className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                          >
                            <Download className="w-4 h-4 text-gray-500" />
                            Download Template
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Box 1: File Uploader Card */}
                        <div
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                          className={\`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all bg-gray-50 \${dragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}\`}
                        >
                          <input
                            type="file"
                            accept=".xlsx,.xls,.csv,.txt,.json"
                            onChange={(e) => {
                                setIsSyncingSheets(true);
                                setTimeout(() => {
                                    handleScheduleFileChange(e);
                                    setIsSyncingSheets(false);
                                }, 500); // Fake small delay to show progress state
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-105 transition-transform">
                            <Upload className="w-8 h-8" />
                          </div>
                          <h4 className="text-gray-900 font-bold text-base">Drag & drop your file here</h4>
                          <p className="text-gray-500 text-sm mt-1">or click to browse from your computer</p>
                          <p className="text-xs text-gray-400 mt-4 leading-relaxed max-w-xs mx-auto">
                            Requires Agent Name, Date, and Shift columns. Missing agents will be auto-registered.
                          </p>
                        </div>

                        {/* Box 2: Google Sheets URL Import */}
                        <div className="border border-gray-200 bg-white shadow-sm rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <svg className="w-6 h-6" viewBox="0 0 48 48">
                              <path fill="#34A853" d="M41.5 8h-35C4 8 2 10 2 12.5v23C2 38 4 40 6.5 40h35c2.5 0 4.5-2 4.5-4.5v-23C46 10 44 8 41.5 8z"></path>
                              <path fill="#188038" d="M31.5 8h-25v32h25V8z"></path>
                              <path fill="#E8F0FE" d="M36 15.5h6v4h-6v-4zM36 24h6v4h-6v-4zM8 15.5h5v4H8v-4zM8 24h5v4H8v-4z"></path>
                            </svg>
                          </div>
                          <h4 className="font-bold text-gray-900">Import via Google Sheets</h4>
                          <p className="text-xs text-gray-500 mt-1 mb-4 max-w-[200px] mx-auto">Automatically sync live roster from Google Workspace.</p>
                          <div className="w-full flex space-x-2 relative group">
                            <input
                              type="text"
                              value={googleSheetId}
                              onChange={(e) => {
                                let val = e.target.value;
                                const match = val.match(/\\/d\\/([a-zA-Z0-9-_]+)/);
                                if (match) val = match[1];
                                setGoogleSheetId(val);
                                setStorageItem('sched_google_sheet_id', val);
                              }}
                              placeholder="Paste Sheets URL..."
                              className="flex-1 bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                            />
                            <button
                              onClick={async () => {
                                if (!googleSheetId) {
                                  toast.error("Please provide a valid Google Sheet ID or URL.");
                                  return;
                                }
                                try {
                                  setIsSyncingSheets(true);
                                  setUploadError(null);
                                  setUploadSuccess(null);
                                  
                                  const text = await fetchGoogleSheetCSV(googleSheetId, '0');
                                  const result = parseScheduleCSV(text, agentsList);
                                  
                                  if (result.errors.length > 0) {
                                     setUploadError(result.errors.join('\\n'));
                                  }
                                  if (result.schedules.length > 0) {
                                    setTempSchedules(result.schedules);
                                    setTempNewAgents(result.newAgents || []);
                                    setUploadSuccess(\`Successfully extracted \${result.schedules.length} shifts.\`);
                                  } else {
                                     setUploadError((prev) => (prev ? prev + "\\n" : "") + "No schedule data found.");
                                  }
                                } catch (err) {
                                  setUploadError("Extraction failed: " + err.message);
                                } finally {
                                  setIsSyncingSheets(false);
                                }
                              }}
                              disabled={isSyncingSheets}
                              className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                            >
                              {isSyncingSheets ? 'Syncing...' : 'Sync Data'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Display Data Summary Block */}
                      {(tempSchedules.length > 0 || uploadError) && (
                        <div className="border border-gray-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col pt-2 mt-8">
                            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-indigo-500" /> Upload Preview Summary
                                    </h4>
                                    <p className="text-xs text-gray-500 mt-1">Review validation and any mapping errors before saving.</p>
                                </div>
                                {tempSchedules.length > 0 && (
                                   <div className="flex gap-3">
                                        <button onClick={() => { setTempSchedules([]); setUploadError(null); setUploadSuccess(null); }} className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors">Discard</button>
                                        <button onClick={commitSchedules} className="px-5 py-2 bg-emerald-600 text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                                            <CheckCircle2 className="w-4 h-4" /> Save Schedule ({tempSchedules.length} items)
                                        </button>
                                   </div>
                                )}
                            </div>

                            {/* Show Error Rows */}
                            {uploadError && (
                                <div className="bg-red-50 p-4 border-b border-red-100">
                                    <h5 className="text-red-800 font-bold text-sm flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4"/> Parsing Errors
                                    </h5>
                                    <ul className="list-disc pl-5 text-xs text-red-600 font-mono space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-4">
                                        {uploadError.split('\\n').filter(Boolean).map((err, i) => (
                                            <li key={i}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Show Summary Table */}
                            {tempSchedules.length > 0 && (
                                <div className="max-h-80 overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-sm">
                                        <thead className="bg-[#f8fafc] sticky top-0 border-b border-gray-200">
                                            <tr>
                                                <th className="p-3 pl-6 font-semibold text-gray-700">Agent</th>
                                                <th className="p-3 font-semibold text-gray-700">Date</th>
                                                <th className="p-3 font-semibold text-gray-700">Shift Mapped To</th>
                                                <th className="p-3 pr-6 font-semibold text-gray-700 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {tempSchedules.slice(0, 100).map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="p-3 pl-6 font-medium text-gray-900">{row.agentName}</td>
                                                    <td className="p-3 text-gray-500 font-mono">{row.date}</td>
                                                    <td className="p-3"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-xs">{row.shiftLabel}</span></td>
                                                    <td className="p-3 pr-6 text-right">
                                                        <span className="text-emerald-600 text-xs font-semibold flex items-center justify-end gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">✓</span> Valid</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {tempSchedules.length > 100 && (
                                        <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 border-t border-gray-100">
                                            Showing top 100 entries out of {tempSchedules.length}.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                      )}
                    </div>
                  )}

`;

    // Splicing
    let newLines = [...lines];
    newLines.splice(startIdx2, endIdx2 - startIdx2); // Delete 2nd block entirely
    newLines.splice(startIdx1, endIdx1 - startIdx1, component); // Replace 1st block

    fs.writeFileSync('src/App.tsx', newLines.join('\n'));
    console.log('Patched App.tsx successfully.');
} else {
    console.error('Could not find markers', { startIdx1, endIdx1, startIdx2, endIdx2 });
}
