import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/agentLevel \+ 1/g, '(!isNaN(agentLevel) ? agentLevel + 1 : 1)');
content = content.replace(/\{levelProgress\}%/g, '{!isNaN(levelProgress) ? levelProgress : 0}%');
content = content.replace(/\(!isNaN\(pendingRequestsCount \+ activeCasesCount\) \? \(pendingRequestsCount \+ activeCasesCount\) : 0\)/g, "((!isNaN(pendingRequestsCount) ? pendingRequestsCount : 0) + (!isNaN(activeCasesCount) ? activeCasesCount : 0))");

fs.writeFileSync('src/App.tsx', content);

let dsContent = fs.readFileSync('src/components/DashboardSummary.tsx', 'utf8');
dsContent = dsContent.replace(/\(!isNaN\(pendingRequestsCount \+ activeCasesCount\) \? \(pendingRequestsCount \+ activeCasesCount\) : 0\)/g, "((!isNaN(pendingRequestsCount) ? pendingRequestsCount : 0) + (!isNaN(activeCasesCount) ? activeCasesCount : 0))");
fs.writeFileSync('src/components/DashboardSummary.tsx', dsContent);
