import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
        isDarkMode 
        ? 'bg-slate-900 border-slate-700 text-slate-100 hover:bg-slate-800' 
        : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-50 shadow-sm'
      }`}
      title="Toggle Dark/Light Mode"
    >
      {isDarkMode ? (
        <Moon className="w-5 h-5 text-indigo-400" />
      ) : (
        <Sun className="w-5 h-5 text-amber-500" />
      )}
    </button>
  );
};
