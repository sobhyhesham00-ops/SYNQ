const fs = require('fs');

const run = (file) => {
  const code = fs.readFileSync(file, 'utf-8');
  const lines = code.split('\n');

  let braceDepth = 0;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check if line calls set[A-Z]
    if (line.match(/\bset[A-Z][a-zA-Z0-9]*\s*\(/)) {
       // if not in a callback, useEffect, handler, function
       if (braceDepth <= 1) { // 0 is module scope, 1 is component body
          console.log(file + ":" + (i+1) + " depth=" + braceDepth + " -> " + line.trim());
       }
    }
    
    // rudimentary brace counting
    braceDepth += (line.match(/\{/g) || []).length;
    braceDepth -= (line.match(/\}/g) || []).length;
  }
}

run('src/App.tsx');
run('src/components/MetricsReport.tsx');
run('src/components/DashboardSummary.tsx');
run('src/components/OrdersTab.tsx');
run('src/components/QAScorecards.tsx');
run('src/components/AIAssistant.tsx');
