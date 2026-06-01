const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/<ScheduleUpload \/>/g, '');

c = c.replace(/globalMeta\.filter/g, 'registeredUsers.filter');
c = c.replace(/globalMeta\.length/g, 'registeredUsers.length');

// Find AnimatePresence mode="wait" and fix the EOF
const marker = '</AnimatePresence>';
const idx = c.lastIndexOf(marker);

c = c.substring(0, idx + marker.length) + `
        </div>
      </main>
    </div>
  )}
  </div>
</div>
);
}
`;

fs.writeFileSync('src/App.tsx', c);
console.log('Done');
