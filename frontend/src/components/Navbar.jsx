import React from 'react';
import { Sun, Moon, LogOut, GraduationCap, LayoutDashboard, Flame, Bell } from 'lucide-react';

export default function Navbar({ 
  currentPage, 
  navigateTo, 
  isAuthenticated, 
  user, 
  onLogout, 
  darkMode, 
  setDarkMode,
  toggleTheme
}) {
  return (
    <nav className={`sticky top-0 z-50 border-b transition-all duration-300 glass-panel ${
      darkMode ? 'border-slate-900/60 bg-[#0d121f]/90' : 'border-slate-200/50 bg-white/80'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            onClick={() => navigateTo(isAuthenticated ? 'dashboard' : 'landing')} 
            className="flex items-center space-x-2 cursor-pointer group select-none"
          >
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl text-white shadow-md shadow-indigo-500/20 dark:shadow-none transition-transform group-hover:scale-105">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className={`text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent`}>
              StudyAI Notes
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && currentPage !== 'landing' && (
              <button
                onClick={() => navigateTo('dashboard')}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  currentPage === 'dashboard'
                    ? darkMode
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    : darkMode
                      ? 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                      : 'text-slate-650 hover:bg-slate-150/40 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </button>
            )}

            {/* Streak Counter (Active when logged in) */}
            {isAuthenticated && currentPage !== 'landing' && (
              <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full text-xs font-bold select-none">
                <Flame className="h-4 w-4 fill-amber-500" />
                <span>5 Day Streak</span>
              </div>
            )}

            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all ${
                darkMode ? 'text-amber-400 hover:bg-slate-800/50' : 'text-indigo-650 hover:bg-slate-100'
              }`}
              title={`Switch to ${darkMode ? 'Light' : 'Dark'} Mode`}
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400 animate-pulse" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User Profile avatar / Sign out trigger */}
            {isAuthenticated ? (
              <div className={`flex items-center space-x-3.5 border-l pl-4 ${
                darkMode ? 'border-slate-900' : 'border-slate-200/80'
              }`}>
                <div className="hidden sm:flex flex-col items-end">
                  <span className={`text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {user?.full_name || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Student</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow">
                  {user?.full_name ? user.full_name[0].toUpperCase() : user?.email[0].toUpperCase()}
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              currentPage !== 'auth' && (
                <button
                  onClick={() => navigateTo('auth')}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow transform active:scale-95 transition-all"
                >
                  Sign In
                </button>
              )
            )}

          </div>

        </div>
      </div>
    </nav>
  );
}
