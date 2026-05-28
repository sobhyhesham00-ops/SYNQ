const fs = require('fs');

const run = (file) => {
  const code = fs.readFileSync(file, 'utf-8');
  const lines = code.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // looking for setState in root level of react component rendering
    // any set* that is indented exactly 2 spaces or 4 spaces could be suspect if we are inside a component
    if (line.match(/^  set[A-Z]/)) {
       console.log("SUSPECT RENDER LEVEL STATE: " + file + " : " + (i+1) + " -> " + line.trim());
    }
  }
}

run('src/App.tsx');
run('src/components/MetricsReport.tsx');
run('src/components/DashboardSummary.tsx');
run('src/components/OrdersTab.tsx');
run('src/components/QAScorecards.tsx');
run('src/components/AIAssistant.tsx');
