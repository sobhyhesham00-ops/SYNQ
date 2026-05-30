import fs from 'fs';

function ensureStr(content: string, field: string) {
  content = content.replace(new RegExp(`\\{${field}\\}`, 'g'), `{!isNaN(Number(${field})) ? Number(${field}) : 0}`);
  return content;
}

let qaS = fs.readFileSync('src/components/QAScorecards.tsx', 'utf8');
qaS = ensureStr(qaS, 'score.totalScore');
qaS = ensureStr(qaS, 'score.maxTotalScore');
qaS = ensureStr(qaS, 'calculateTotal\\(\\)');
qaS = ensureStr(qaS, 'calculateMax\\(\\)');
fs.writeFileSync('src/components/QAScorecards.tsx', qaS);

