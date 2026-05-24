const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const sIdx = code.indexOf(`{/* Workspace Sync Panel */}`);
if (sIdx !== -1) {
   const eIdxStr = `                      </div>
                    </div>
                  </div>
                );
              })()}`;
   const eIdx = code.indexOf(eIdxStr, sIdx);
   if (eIdx !== -1) {
       const fullEndIdx = eIdx + eIdxStr.length;
       code = code.substring(0, sIdx) + code.substring(fullEndIdx);
       fs.writeFileSync('src/App.tsx', code);
       console.log('Removed Workspace Sync pane successfully!');
   } else {
       console.log('End target not found');
   }
} else {
   console.log('Start target not found');
}
