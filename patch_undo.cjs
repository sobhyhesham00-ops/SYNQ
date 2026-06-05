const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /{activeTab === "dashboard" && \(\s*<div className="flex flex-col">\s*{.*?}                      <DashboardSummary/s;

code = code.replace(regex, `{activeTab === "dashboard" && (\n                    <DashboardSummary`);

code = code.replace(`                    />\n                    </div>\n                  )}`, `                    />\n                  )}`);

fs.writeFileSync('src/App.tsx', code);
