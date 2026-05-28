import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <button 
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center p-2 rounded-xl transition-all duration-300
        ${isDark 
          ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 shadow-inner border border-slate-700' 
          : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 shadow-sm border border-indigo-200'
        }
      `}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 animate-pulse" />
      ) : (
        <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}
