const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src', 'App.tsx');
let code = fs.readFileSync(p, 'utf8');

const isInstalledState = `
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true || 
           document.referrer.includes('android-app://');
  });

  useEffect(() => {
    const mql = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!isInstalled && !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center shadow-xl">
          <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Download className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-4">App Installation Required</h2>
          <p className="text-slate-400 mb-8">
            For security and reliability, this portal must be installed on your device (PC, iOS, or Android). 
            Please use your browser's "Install App" or "Add to Home Screen" feature to continue.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm">
            <Info className="w-4 h-4" />
            Waiting for installation...
          </div>
        </div>
      </div>
    );
  }
`;

if (!code.includes('const [isInstalled, setIsInstalled]')) {
  const index = code.indexOf('  if (!currentUser) {');
  if (index !== -1) {
    code = code.substring(0, index) + isInstalledState + '\\n' + code.substring(index);
    fs.writeFileSync(p, code);
    console.log('Added isInstalled state.');
  } else {
    console.log('Could not find inserting point.');
  }
} else {
  console.log('Already added.');
}
