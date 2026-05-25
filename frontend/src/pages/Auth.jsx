import React, { useState } from 'react';
import { Mail, Lock, User, GraduationCap, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function Auth({ onLoginSuccess, navigateTo }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !fullName)) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Trigger login
        const result = await api.login(email, password);
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      } else {
        // Trigger register
        await api.register(email, password, fullName);
        // Automatically log in after registration
        const result = await api.login(email, password);
        if (onLoginSuccess) {
          onLoginSuccess(result.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        
        {/* Form Container */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border shadow-glass-light dark:shadow-none flex flex-col space-y-6">
          
          {/* Header */}
          <div className="text-center">
            <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow shadow-indigo-150 mb-4 animate-float">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
              {isLogin ? 'Welcome Back Student!' : 'Create Your Study Account'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold tracking-wider uppercase mt-1">
              {isLogin ? 'Access your study materials' : 'Sign up to get personalized study notes'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-start space-x-2 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <User className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={fullName}
                    placeholder="Enter your full name"
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  placeholder="name@university.edu"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl text-sm focus:border-indigo-500 focus:outline-none dark:text-slate-100 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md rounded-2xl transform active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{isLogin ? 'Authenticating...' : 'Creating Account...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4.5 w-4.5" />
                  <span>{isLogin ? 'Sign In to Portal' : 'Register for Free'}</span>
                </>
              )}
            </button>
          </form>

          {/* Toggle Button */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-xs font-bold text-indigo-500 hover:text-indigo-600 focus:outline-none"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
