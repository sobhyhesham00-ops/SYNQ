const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const marker = '</AnimatePresence>';
const idx = c.lastIndexOf(marker);

c = c.substring(0, idx + marker.length) + `
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
`;

fs.writeFileSync('src/App.tsx', c);
console.log('Fixed syntax error');
