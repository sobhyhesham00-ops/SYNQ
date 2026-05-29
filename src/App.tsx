import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { ScheduleUpload } from './components/ScheduleUpload';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { AIChat } from './components/AIChat';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) 
        ? 'dark' 
        : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 font-sans">
        <Navigation theme={theme} toggleTheme={toggleTheme} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<AnalysisDashboard />} />
              <Route path="/upload" element={<ScheduleUpload />} />
              <Route path="/chat" element={<AIChat />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;
