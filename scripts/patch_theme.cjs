const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add imports
if (!code.includes("import { useTheme }")) {
  code = code.replace(
    "import { useSync } from './hooks/useSync';",
    "import { useSync } from './hooks/useSync';\nimport { useTheme } from './context/ThemeContext';\nimport { ThemeToggle } from './components/ThemeToggle';"
  );
}

// 2. Remove old state
const stateToRemove = `  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved !== 'light';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('theme-light');
    } else {
      document.body.classList.add('theme-light');
    }
    localStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);`;

if (code.includes('const [isDarkMode, setIsDarkMode]')) {
  code = code.replace(stateToRemove, '  const { isDarkMode, theme } = useTheme();');
}

// 3. Replace toggle button
const buttonPattern = /<button[\s\S]*?onClick=\{\(\) => \{\s*setIsDarkMode\(!isDarkMode\);\s*toast\.success\([^`]*\`Theme switched to \$\{!\w+\s*\?\s*'Dark'\s*:\s*'Light'\}\s*Mode!\s*🎨\`\);\s*\}\}[\s\S]*?<\/button>/m;
if (code.match(buttonPattern)) {
    code = code.replace(buttonPattern, '<ThemeToggle />');
}

// Write back
fs.writeFileSync('src/App.tsx', code);
console.log('App patched');
