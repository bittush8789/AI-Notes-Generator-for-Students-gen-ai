import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, FileText, CheckSquare, Award, Clock, Trash2, Calendar, 
  ArrowRight, Loader2, Sparkles, BookOpenCheck, Globe, Wand2, Send, 
  ChevronRight, Mic, Paperclip 
} from 'lucide-react';
import { api } from '../services/api';
import UploadZone from '../components/UploadZone';

export default function Dashboard({ navigateTo, user, showToast, darkMode }) {
  const [notes, setNotes] = useState([]);
  const [stats, setStats] = useState({
    total_notes: 0,
    total_files: 0,
    total_flashcards: 0,
    total_quizzes: 0,
    recent_activity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // AI Prompt-to-Notes states
  const [promptText, setPromptText] = useState('');
  const [generationMode, setGenerationMode] = useState('exam');
  const [notesLength, setNotesLength] = useState('medium');
  const [promptLanguage, setPromptLanguage] = useState('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  
  // Typewriter animated placeholder logic
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderText, setPlaceholderText] = useState('');

  const placeholders = useMemo(() => [
    "Ask AI to generate complete study notes...",
    "Explain Machine Learning in Hinglish...",
    "Generate revision notes for DBMS in Hindi...",
    "Create interview preparation notes for Kubernetes...",
    "Explain DSA time complexity with Python examples..."
  ], []);

  useEffect(() => {
    let charIndex = 0;
    let isDeleting = false;
    let timer;

    const tick = () => {
      const fullText = placeholders[placeholderIndex];
      if (isDeleting) {
        setPlaceholderText(fullText.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setPlaceholderText(fullText.substring(0, charIndex + 1));
        charIndex++;
      }

      let typingSpeed = 60;
      if (isDeleting) typingSpeed /= 2;

      if (!isDeleting && charIndex === fullText.length) {
        typingSpeed = 2200; // Pause at end of text
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        typingSpeed = 500;
      }

      timer = setTimeout(tick, typingSpeed);
    };

    tick();
    return () => clearTimeout(timer);
  }, [placeholderIndex, placeholders]);

  const fetchDashboardData = async () => {
    try {
      const notesList = await api.listNotes();
      setNotes(notesList);
      
      const statsData = await api.getDashboardStats();
      setStats(statsData);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUploadComplete = (newNote) => {
    fetchDashboardData();
    showToast(`Compiled "${newNote.title}" study guide successfully!`, 'success');
    navigateTo('viewer', newNote.id);
  };

  const handleDelete = async (e, noteId) => {
    e.stopPropagation();
    if (!window.confirm('Permanently delete these study notes along with all flashcards, quizzes, and chat memory?')) {
      return;
    }
    
    try {
      await api.deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      const statsData = await api.getDashboardStats();
      setStats(statsData);
      showToast('Study guide deleted from workspace.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete note.', 'error');
    }
  };

  // AI Prompt actions
  const handleEnhancePrompt = async () => {
    if (!promptText.trim()) {
      showToast('Please type a study topic or prompt first.', 'info');
      return;
    }
    showToast('AI is optimizing prompt constraints...', 'info');
    try {
      const data = await api.enhancePrompt(promptText);
      setPromptText(data.enhanced_prompt);
      showToast('Prompt enhanced for academic depth!', 'success');
    } catch (err) {
      showToast('Enhancer unavailable. Generating with raw prompt.', 'error');
    }
  };

  const handleGenerateNotes = async () => {
    if (!promptText.trim()) {
      showToast('Please enter a study topic or query.', 'info');
      return;
    }
    
    setIsGenerating(true);
    setGenerationStep(1);
    
    // Simulate generation ticks during the server compilation pipeline
    const interval = setInterval(() => {
      setGenerationStep((prev) => {
        if (prev < 5) return prev + 1;
        return prev;
      });
    }, 1600);

    try {
      const newNote = await api.generateNotesFromPrompt(
        promptText,
        generationMode,
        notesLength,
        promptLanguage
      );
      
      clearInterval(interval);
      setGenerationStep(6);
      
      setTimeout(() => {
        setIsGenerating(false);
        setPromptText('');
        showToast(`AI Notebook "${newNote.title}" generated successfully!`, 'success');
        navigateTo('viewer', newNote.id);
      }, 700);
      
    } catch (err) {
      clearInterval(interval);
      setIsGenerating(false);
      showToast(err.message || 'Failed to generate study notes.', 'error');
    }
  };

  const applyTemplate = (tplPrompt) => {
    setPromptText(tplPrompt);
    showToast('Preset template loaded. Click Enhance to expand!', 'info');
  };

  const templates = [
    { label: '📝 Exam Prep Notes', prompt: 'Generate comprehensive, exam-focused preparation notes exploring the key pillars of: ' },
    { label: '⚡ Revision Notes', prompt: 'Create short, high-impact active recall revision notes and key concepts for: ' },
    { label: '🧒 Simple Explanation', prompt: 'Explain this topic in simple, beginner-friendly language with clear analogies: ' },
    { label: '💼 Interview Prep', prompt: 'Generate interview preparation notes, QA, and cheat sheet for: ' },
    { label: '🔍 Deep-Dive Study', prompt: 'Provide a highly detailed, advanced academic study guide exploring the architecture of: ' },
    { label: '📋 Quick Summary', prompt: 'Synthesize a high-impact quick summary sheet, critical terms list, and core takeaways for: ' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow py-20 space-y-3">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading student desk...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow flex flex-col space-y-8 relative">
      
      {/* Dynamic Streaming Progressive Step Progress Loader Backdrop */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md">
          <div className={`p-8 sm:p-10 rounded-3xl border w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center flex flex-col items-center space-y-6 ${
            darkMode ? 'bg-slate-900 border-indigo-500/10' : 'bg-white border-slate-200'
          }`}>
            <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            
            <div className="space-y-1">
              <h3 className={`font-black text-lg ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                Synthesizing AI Study Notebook
              </h3>
              <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                Our educational pipeline is compiling notes, recall cards, and exam questions...
              </p>
            </div>

            {/* Dynamic Step visualizer */}
            <div className="w-full space-y-3 text-left border-t pt-5 border-slate-250 dark:border-slate-800">
              {[
                { step: 1, label: 'Formulating academic curriculum objectives' },
                { step: 2, label: 'Optimizing structured custom prompts' },
                { step: 3, label: 'Drafting core descriptions, formulas & code' },
                { step: 4, label: 'Pre-compiling 20 study recall flashcards' },
                { step: 5, label: 'Compiling 10 graded practice quizzes' },
                { step: 6, label: 'Filing completed study guide to workspace' }
              ].map((item) => {
                const isActive = generationStep === item.step;
                const isCompleted = generationStep > item.step;
                return (
                  <div key={item.step} className="flex items-center space-x-3.5 text-xs font-semibold leading-relaxed">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center border font-mono text-[10px] flex-shrink-0 ${
                      isCompleted 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                        : isActive 
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 animate-pulse' 
                          : 'bg-slate-500/5 border-slate-700 text-slate-500'
                    }`}>
                      {isCompleted ? '✓' : item.step}
                    </div>
                    <span className={`${
                      isCompleted 
                        ? 'text-slate-400 line-through decoration-slate-700' 
                        : isActive 
                          ? 'text-indigo-500 font-extrabold' 
                          : 'text-slate-550'
                    }`}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6 transition-colors border-slate-200/50 dark:border-slate-800/80">
        <div>
          <h1 className={`text-2xl sm:text-3.5xl font-extrabold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
            <span>Welcome, {user?.full_name || user?.email?.split('@')[0]}!</span>
            <Sparkles className="h-6 w-6 text-indigo-500 animate-float" />
          </h1>
          <p className={`text-xs sm:text-sm font-semibold text-slate-500`}>
            Type a topic or upload your lectures to generate beautiful, interactive notebooks instantly.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid (4 standard metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Generated Guides', val: stats.total_notes, icon: BookOpen, color: 'text-indigo-500' },
          { label: 'Reference Files', val: stats.total_files, icon: FileText, color: 'text-emerald-500' },
          { label: 'Recall Cards', val: stats.total_flashcards, icon: CheckSquare, color: 'text-amber-500' },
          { label: 'Quizzes Taken', val: stats.total_quizzes, icon: Award, color: 'text-rose-500' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={`glass-panel p-5 rounded-2xl border transition-all ${
              darkMode 
                ? 'border-indigo-500/10 shadow-[0_0_15px_-3px_rgba(99,102,241,0.05)]' 
                : 'border-indigo-100 shadow-sm shadow-indigo-100/5 bg-white'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-indigo-500/10 rounded-xl ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 select-none block tracking-wider">{item.label}</span>
                  <span className={`text-lg sm:text-xl font-extrabold mt-0.5 block ${darkMode ? 'text-white' : 'text-slate-800'}`}>{item.val}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Futuristic AI Prompt-to-Notes Cockpit Section */}
      <div className={`glass-panel p-6 sm:p-8 rounded-3xl border shadow-glass-light relative overflow-hidden ${
        darkMode 
          ? 'border-indigo-950/60 bg-gradient-to-br from-slate-900/40 via-indigo-950/5 to-slate-900/30' 
          : 'border-indigo-100 bg-gradient-to-br from-white via-indigo-50/10 to-white shadow shadow-slate-100'
      }`}>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none select-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none select-none"></div>

        <div className="flex items-start space-x-4 relative z-10">
          <div className="p-3.5 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-2xl shadow-lg shadow-indigo-500/10 hidden sm:block">
            <Sparkles className="h-6 w-6 animate-pulse" />
          </div>
          
          <div className="flex-grow space-y-5">
            <div className="space-y-1">
              <h2 className={`text-lg sm:text-xl font-black ${darkMode ? 'text-white' : 'text-slate-850'}`}>
                AI Prompt-to-Notes Generator
              </h2>
              <p className="text-xs text-slate-450 leading-relaxed font-semibold">
                Generate highly formatted, deep-dive academic study notebooks instantly by typing a custom prompt. No file upload required!
              </p>
            </div>

            {/* Glowing Textarea Cockpit */}
            <div className={`relative rounded-2xl border transition-all duration-300 p-2.5 flex flex-col space-y-2 ${
              darkMode 
                ? 'bg-slate-950/40 border-slate-850 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10' 
                : 'bg-white border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/5 shadow shadow-indigo-100/10'
            }`}>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={placeholderText}
                className="w-full bg-transparent border-none outline-none resize-none font-semibold text-sm leading-relaxed p-2 text-slate-700 dark:text-slate-200 h-28 scrollbar-none"
              />
              
              {/* Accessory row */}
              <div className="flex items-center justify-between border-t pt-2 border-slate-200/50 dark:border-slate-900 select-none">
                <div className="flex items-center space-x-2 text-slate-450">
                  <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-indigo-500 transition-colors cursor-pointer" title="Voice dictation input">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-indigo-500 transition-colors cursor-pointer" title="Attach reference text file">
                    <Paperclip className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleEnhancePrompt}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border transform active:scale-95 cursor-pointer ${
                      darkMode
                        ? 'border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10'
                        : 'border-indigo-200 text-indigo-650 hover:bg-indigo-50'
                    }`}
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>Enhance Prompt</span>
                  </button>

                  <button
                    onClick={handleGenerateNotes}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-black shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02] transform active:scale-95 cursor-pointer transition-all"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Generate Notebook</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Chips Preset Templates */}
            <div className="space-y-2 select-none">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-450 block">Preset Study Templates</span>
              <div className="flex flex-wrap gap-2">
                {templates.map((tpl, index) => (
                  <button
                    key={index}
                    onClick={() => applyTemplate(tpl.prompt)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all transform active:scale-95 cursor-pointer border ${
                      darkMode 
                        ? 'bg-slate-900 border-slate-850 hover:bg-slate-850 hover:border-slate-800 text-slate-350' 
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generation Parameters Toolbar Row */}
            <div className="flex flex-wrap items-center gap-6 border-t pt-5 border-slate-250 dark:border-slate-900 text-xs font-semibold text-slate-450 select-none">
              {/* Modes Selection */}
              <div className="flex items-center space-x-2">
                <span>Study Mode:</span>
                <select
                  value={generationMode}
                  onChange={(e) => setGenerationMode(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-lg border outline-none font-bold ${
                    darkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="beginner">🧒 Beginner Friendly</option>
                  <option value="intermediate">📈 Intermediate Explanation</option>
                  <option value="advanced">🔍 Advanced Deep Dive</option>
                  <option value="exam">📝 Exam Prep Focus</option>
                  <option value="interview">💼 Interview Prep QA</option>
                  <option value="research">🧬 Research Mode</option>
                </select>
              </div>

              {/* Length Selection */}
              <div className="flex items-center space-x-2">
                <span>Material Length:</span>
                <select
                  value={notesLength}
                  onChange={(e) => setNotesLength(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-lg border outline-none font-bold ${
                    darkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="short">Short Notes (Summary Sheet)</option>
                  <option value="medium">Medium Notes (Standard guide)</option>
                  <option value="detailed">Detailed Notes (Full Syllabus)</option>
                  <option value="full">Full study program (Textbook length)</option>
                </select>
              </div>

              {/* Languages Selection */}
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-indigo-500" />
                <span>Output Language:</span>
                <select
                  value={promptLanguage}
                  onChange={(e) => setPromptLanguage(e.target.value)}
                  className={`px-2.5 py-1.5 rounded-lg border outline-none font-bold ${
                    darkMode ? 'bg-slate-900 border-slate-850 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <option value="en">English (default)</option>
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="hinglish">Hinglish (Hindi written in Roman)</option>
                </select>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Main Workspace Split column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column (Narrow): Upload Zone & stats logs */}
        <div className="lg:col-span-1 flex flex-col space-y-8">
          
          {/* Upload Zone component */}
          <UploadZone onUploadComplete={handleUploadComplete} darkMode={darkMode} />

          {/* Recent activities achievements */}
          <div className={`glass-panel p-6 rounded-3xl border shadow-glass-light flex flex-col ${
            darkMode ? 'border-slate-900 bg-slate-900/40' : 'border-slate-200 bg-white'
          }`}>
            <h3 className={`font-bold text-sm flex items-center gap-1.5 pb-3 border-b ${
              darkMode ? 'text-slate-200 border-slate-900/60' : 'text-slate-850 border-slate-100'
            }`}>
              <Clock className="h-4.5 w-4.5 text-indigo-500" />
              <span>Recent Desk Activities</span>
            </h3>

            {stats.recent_activity.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No activities recorded yet.</p>
            ) : (
              <div className="space-y-3.5 mt-4">
                {stats.recent_activity.map((act) => (
                  <div key={act.id} className="flex items-start space-x-3 text-xs leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0"></div>
                    <div className="flex-grow">
                      <p className={`font-semibold ${darkMode ? 'text-slate-355' : 'text-slate-700'}`}>
                        {act.details || `${act.action_type} completed`}
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        {new Date(act.created_at).toLocaleDateString()} at {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Smart revision suggestion planner */}
          <div className={`glass-panel p-6 rounded-3xl border flex flex-col space-y-3 shadow-glass-light ${
            darkMode 
              ? 'border-indigo-950/40 bg-gradient-to-tr from-indigo-50/10 to-white/5' 
              : 'border-indigo-100 bg-gradient-to-tr from-indigo-50/20 to-white shadow shadow-slate-100'
          }`}>
            <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpenCheck className="h-4.5 w-4.5" />
              <span>Smart Study Plan</span>
            </h4>
            <h3 className={`font-bold text-sm ${darkMode ? 'text-slate-205' : 'text-slate-800'}`}>Revision Recommendation</h3>
            <p className={`text-xs leading-relaxed font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-650'}`}>
              We recommend reviewing the flashcards for your recently uploaded lectures using **Spaced Repetition** to ensure 90% knowledge retention before exams.
            </p>
          </div>

        </div>

        {/* Right column (Wide): Masonry Notebooks Grid */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          
          <div className="flex items-center justify-between select-none">
            <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
              <BookOpen className="h-5.5 w-5.5 text-indigo-500" />
              <span>Generated Lecture Notebooks</span>
            </h2>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
              darkMode ? 'bg-slate-900 border border-slate-850 text-slate-400' : 'bg-slate-100 border border-slate-200 text-slate-500'
            }`}>
              {notes.length} Active
            </span>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-600 dark:text-rose-400 text-sm">
              {error}
            </div>
          )}

          {notes.length === 0 ? (
            <div className={`glass-panel p-12 rounded-3xl border text-center flex flex-col items-center justify-center space-y-4 shadow-glass-light py-16 ${
              darkMode ? 'border-slate-900' : 'border-slate-200/80 bg-white shadow shadow-slate-100'
            }`}>
              <BookOpen className={`h-12 w-12 animate-float ${darkMode ? 'text-slate-700' : 'text-slate-350'}`} />
              <div>
                <h3 className={`font-bold text-base ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Your Lecture Notebook is Empty</h3>
                <p className="text-xs text-slate-550 max-w-sm mt-1 leading-relaxed">
                  Enter a study topic above or upload a physical PDF, slide, or recording to generate your first AI smart notebook guide!
                </p>
              </div>
            </div>
          ) : (
            /* Premium lecture notebooks grid list */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {notes.map((note) => {
                return (
                  <div
                    key={note.id}
                    onClick={() => navigateTo('viewer', note.id)}
                    className={`glass-card p-5 rounded-2xl border flex flex-col justify-between h-44 group cursor-pointer ${
                      darkMode ? 'border-slate-900/60 shadow-[0_4px_25px_0_rgba(0,0,0,0.3)]' : 'border-slate-150 shadow shadow-slate-100'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 text-[10px] font-bold uppercase tracking-wider select-none">
                          {note.language === 'hi' ? 'Hindi / हिंदी' : note.language === 'hinglish' ? 'Hinglish' : 'English'}
                        </span>
                        <button
                          onClick={(e) => handleDelete(e, note.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Delete Notes"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <h3 className={`font-bold text-sm line-clamp-2 leading-snug group-hover:text-indigo-500 transition-colors ${
                        darkMode ? 'text-slate-100' : 'text-slate-805'
                      }`}>
                        {note.title}
                      </h3>
                    </div>

                    <div className={`flex items-center justify-between border-t pt-3 select-none ${
                      darkMode ? 'border-slate-900/60' : 'border-slate-100'
                    }`}>
                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-450 font-bold uppercase">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <span className="text-[10px] font-bold text-indigo-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Open Desk</span>
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
