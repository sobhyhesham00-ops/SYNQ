const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const [logDateTo, setLogDateTo] = useState('');`,
  `const [logDateTo, setLogDateTo] = useState('');\n  const [logPage, setLogPage] = useState(1);`
);

code = code.replace(
  `  // Derived counts for overview cards`,
  `  const PAGE_SIZE = 25;\n  const paginatedLogs = filteredLogs.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE);\n  const totalPages = Math.ceil(filteredLogs.length / PAGE_SIZE);\n\n  // Derived counts for overview cards`
);

// We should reset page when filter changes:
code = code.replace(
  `onChange={(e) => setSearchQuery(e.target.value)}`,
  `onChange={(e) => { setSearchQuery(e.target.value); setLogPage(1); }}`
);
code = code.replace(
  `onChange={(e) => setLogDateFrom(e.target.value)}`,
  `onChange={(e) => { setLogDateFrom(e.target.value); setLogPage(1); }}`
);
code = code.replace(
  `onChange={(e) => setLogDateTo(e.target.value)}`,
  `onChange={(e) => { setLogDateTo(e.target.value); setLogPage(1); }}`
);
code = code.replace(
  `onClick={() => setLogFilter("all")}`,
  `onClick={() => { setLogFilter("all"); setLogPage(1); }}`
);
code = code.replace(
  `onClick={() => setLogFilter("swap")}`,
  `onClick={() => { setLogFilter("swap"); setLogPage(1); }}`
);
code = code.replace(
  `onClick={() => setLogFilter("annual")}`,
  `onClick={() => { setLogFilter("annual"); setLogPage(1); }}`
);

// Map
code = code.replace(
  `filteredLogs.map((req) => {`,
  `paginatedLogs.map((req) => {`
);

// End of table to insert pagination
code = code.replace(
  `                            </table>
                          </div>
                        </div>`,
`                            </table>
                          </div>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between px-4 py-3 bg-white/5 border border-white/10 rounded-2xl">
                            <button
                              onClick={() => setLogPage(p => Math.max(1, p - 1))}
                              disabled={logPage === 1}
                              className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20 transition-all font-sans"
                            >
                              &larr; Prev
                            </button>
                            <span className="text-sm font-medium text-slate-400 font-sans">
                              Page {logPage} of {totalPages}
                            </span>
                            <button
                              onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                              disabled={logPage === totalPages}
                              className="px-4 py-2 text-sm font-medium text-slate-300 bg-white/10 rounded-lg disabled:opacity-50 hover:bg-white/20 transition-all font-sans"
                            >
                              Next &rarr;
                            </button>
                          </div>
                        )}`
);

fs.writeFileSync('src/App.tsx', code);
