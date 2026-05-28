import React from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Menu,
  X,
  Bell,
  Search,
  MessageSquare
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export interface NavigationProps {
  children: React.ReactNode;
  activePath?: string;
}

export function Navigation({ children, activePath = 'dashboard' }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'team', label: 'Team Directory', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col md:flex-row transition-colors duration-300">
      
      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 text-indigo-400 font-black tracking-wider uppercase text-lg">
          <div className="w-8 h-8 bg-indigo-500 text-white rounded flex items-center justify-center font-bold">W</div>
          Portal
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="hidden md:flex items-center gap-3 h-20 px-6 border-b border-slate-800">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20">W</div>
            <span className="font-black tracking-wider uppercase text-slate-200">Force</span>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activePath === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left
                    ${isActive 
                      ? 'bg-indigo-500/10 text-indigo-400 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'opacity-70'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800">
             <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                   <Users className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-sm font-bold text-white truncate">Admin User</p>
                   <p className="text-[10px] text-slate-400 uppercase tracking-widest truncate">WFM Director</p>
                </div>
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between h-20 px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 w-96">
            <Search className="w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search schedules, agents, requests..." 
              className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
            />
          </div>
          <div className="flex items-center gap-6">
            <ThemeToggle />
            <button className="relative text-slate-400 hover:text-indigo-400 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-900"></span>
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-20 md:hidden animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
