const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  `const [logFilter, setLogFilter] = useState<"all" | "swap" | "annual">("all");\n  const [searchQuery, setSearchQuery] = useState("");`,
  `const [logFilter, setLogFilter] = useState<"all" | "swap" | "annual">("all");\n  const [searchQuery, setSearchQuery] = useState("");\n  const [logDateFrom, setLogDateFrom] = useState('');\n  const [logDateTo, setLogDateTo] = useState('');`
);

code = code.replace(
  `const matchType = logFilter === 'all' || r.type === logFilter;\n    return matchSearch && matchType;`,
  `const matchType = logFilter === 'all' || r.type === logFilter;\n    const matchDate = (!logDateFrom || new Date(r.createdAt) >= new Date(logDateFrom)) && (!logDateTo || new Date(r.createdAt) <= new Date(logDateTo + 'T23:59:59'));\n    return matchSearch && matchType && matchDate;`
);

fs.writeFileSync('src/App.tsx', code);
