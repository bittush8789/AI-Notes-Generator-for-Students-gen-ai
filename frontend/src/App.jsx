import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import NotesViewer from './pages/NotesViewer';
import Navbar from './components/Navbar';

// Lucide React Icons for Toast alerts
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'auth', 'dashboard', 'viewer'
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [user, setUser] = useState(api.getCurrentUser());
  
  // Theme Switching State (localStorage & System preference)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('notes_dark_mode');
    if (saved === 'true') return true;
    if (saved === 'false') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Custom Toast state
  const [toast, setToast] = useState({ message: '', type: 'success', active: false });

  // Expose toast notification trigger
  const showToast = (message, type = 'success') => {
    setToast({ message, type, active: true });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (toast.active) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, active: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.active]);

  // Synchronize dark class on body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('notes_dark_mode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('notes_dark_mode', 'false');
    }
  }, [darkMode]);

  // Validate session on launch
  useEffect(() => {
    const authed = api.isAuthenticated();
    setIsAuthenticated(authed);
    if (authed) {
      setUser(api.getCurrentUser());
      if (currentPage === 'landing' || currentPage === 'auth') {
        setCurrentPage('dashboard');
      }
    } else {
      setUser(null);
      if (currentPage !== 'landing') {
        setCurrentPage('auth');
      }
    }
  }, []);

  const navigateTo = (page, noteId = null) => {
    if (noteId) {
      setSelectedNoteId(noteId);
    }
    
    // Auth guard
    if (page === 'dashboard' || page === 'viewer') {
      if (!api.isAuthenticated()) {
        setCurrentPage('auth');
        return;
      }
    }
    
    setCurrentPage(page);
  };

  const handleLoginSuccess = (userData) => {
    setIsAuthenticated(true);
    setUser(userData);
    setCurrentPage('dashboard');
    showToast(`Welcome back, ${userData.full_name || 'student'}!`, 'success');
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('landing');
    showToast('Logged out of study portal successfully.', 'info');
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    showToast(`Switched to ${!darkMode ? 'Obsidian Dark' : 'Vercel Light'} Mode`, 'info');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300 dark:text-slate-100 dark:bg-[#05070c] bg-slate-50 text-slate-800 font-sans antialiased">
      
      {/* Horizontal Top Navbar */}
      <Navbar 
        currentPage={currentPage}
        navigateTo={navigateTo}
        isAuthenticated={isAuthenticated}
        user={user}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        toggleTheme={toggleTheme}
      />

      {/* Main Pages Canvas Container */}
      <main className="flex-grow flex flex-col">
        {currentPage === 'landing' && (
          <Landing navigateTo={navigateTo} isAuthenticated={isAuthenticated} darkMode={darkMode} />
        )}
        
        {currentPage === 'auth' && (
          <Auth onLoginSuccess={handleLoginSuccess} navigateTo={navigateTo} showToast={showToast} darkMode={darkMode} />
        )}
        
        {currentPage === 'dashboard' && (
          <Dashboard navigateTo={navigateTo} user={user} showToast={showToast} darkMode={darkMode} />
        )}
        
        {currentPage === 'viewer' && selectedNoteId && (
          <NotesViewer noteId={selectedNoteId} navigateTo={navigateTo} showToast={showToast} darkMode={darkMode} />
        )}
      </main>

      {/* Animated Floating Toast Alerts */}
      {toast.active && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-80 animate-toast">
          <div className={`p-4 border rounded-2xl shadow-xl flex items-start space-x-3.5 ${
            darkMode 
              ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' 
              : 'bg-white border-slate-200 text-slate-850 shadow-[0_8px_30px_rgba(15,23,42,0.1)]'
          }`}>
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
              {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-500" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-indigo-500" />}
            </div>
            <div className="flex-grow">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                toast.type === 'success' ? 'text-emerald-500' : toast.type === 'error' ? 'text-rose-500' : 'text-indigo-500'
              }`}>
                {toast.type} Alert
              </span>
              <p className={`text-xs font-semibold mt-0.5 leading-normal ${
                darkMode ? 'text-slate-355' : 'text-slate-650'
              }`}>
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
