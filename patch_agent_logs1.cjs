const fs = require('fs');

let content = fs.readFileSync('src/components/AgentRequestsLogs.tsx', 'utf8');

// Patching Fix 2
content = content.replace(
  "const [filterDate, setFilterDate] = useState('');",
  `const [filterDate, setFilterDate] = useState('');\n  const [sortBy, setSortBy] = useState<'date_desc'|'date_asc'|'status'>('date_desc');`
);

const sortedStr = `
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
`;

content = content.replace(
  "  return true;\n  });",
  `  return true;\n  });\n${sortedStr}`
);

content = content.replace(
  `{filtered.length === 0 ? (`,
  `{sorted.length === 0 ? (`
);

content = content.replace(
  `filtered.map(renderCard)`,
  `sorted.map(renderCard)`
);

// Add the sort dropdown next to filter controls
content = content.replace(
  `<Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />`,
  `<Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full md:w-36 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-sans cursor-pointer h-9">
              <option value="date_desc" className="bg-slate-800">Newest First</option>
              <option value="date_asc" className="bg-slate-800">Oldest First</option>
              <option value="status" className="bg-slate-800">By Status</option>
            </select>`
);

// FIX 3
content = content.replace(
  /{canEditItem\(req\.createdAt\) && \(/g,
  `{canEditItem(req.createdAt) && !['approved', 'answered', 'confirmed', 'closed', 'contacted', 'rejected', 'declined', 'cancelled'].includes(req.status) && (`
);

fs.writeFileSync('src/components/AgentRequestsLogs.tsx', content);
