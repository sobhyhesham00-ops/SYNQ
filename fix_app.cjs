const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix 1: The stray </div>
code = code.replace(
  `                      announcements={announcements}\n                    />\n                    </div>\n                  )}`,
  `                      announcements={announcements}\n                    />\n                  )}`
);

// Check if there is still a <div className="flex flex-col"> we removed:
if (code.includes(`{activeTab === "dashboard" && (\n                    <DashboardSummary`)) {
  // We need to restore it so motion.div is closed correctly? No, motion.div wraps `{activeTab === "dashboard" && (...)}`
  // The structure is:
  // <motion.div>
  //   {activeTab === "dashboard" && (
  //      <DashboardSummary />
  //   )}
  // </motion.div>
  //
  // Wait, the error is: Unexpected closing "motion.div" tag does not match opening "div" tag
  // Could it be that some other tag was stripped out?
  // Let's re-add the missing opening div just in case it caused issues?
  // No, if activeTab === "dashboard" just returns <DashboardSummary />, that's 1 element.
  // Wait! What about line 8722?
}

fs.writeFileSync('src/App.tsx', code);
