const fs = require('fs');

function renameInFile(file) {
  let text = fs.readFileSync(file, 'utf8');
  text = text.replace(/isWithinFiveMinutes/g, "canEditItem");
  text = text.replace(/getRemainingEditTimeStr/g, "getRemainingEditTime");
  fs.writeFileSync(file, text);
}

['src/App.tsx', 'src/components/AgentRequestsLogs.tsx', 'src/components/TabbyTamaraCard.tsx'].forEach(renameInFile);
console.log('Renamed variables');
