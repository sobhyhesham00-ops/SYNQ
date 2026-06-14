const fs = require('fs');

const dump = fs.readFileSync('ViteAppDump.txt', 'utf8');
const match = dump.match(/sourceMappingURL=data:application\/json;base64,(.+?)$/);
if (match) {
  const json = Buffer.from(match[1], 'base64').toString('utf8');
  const parsed = JSON.parse(json);
  // parsed.sourcesContent[0] should be the original App.tsx
  fs.writeFileSync('App.recovered.tsx', parsed.sourcesContent[0]);
  console.log("Recovered successfully!");
} else {
  console.log("No sourcemap found :(");
}
