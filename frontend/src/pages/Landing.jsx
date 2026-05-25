import React from 'react';
import { Sparkles, Brain, GraduationCap, ArrowRight, BookOpen, MessageSquare, ShieldCheck } from 'lucide-react';

export default function Landing({ navigateTo, isAuthenticated }) {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
      
      {/* Background abstract gradient blur spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        
        {/* Decorative Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full glass-panel border border-indigo-100/50 dark:border-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-float shadow shadow-indigo-100/10">
          <Sparkles className="h-4 w-4" />
          <span>Supercharged Student Study Platform</span>
        </div>

        {/* Catchy Headline */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Transform Your Lectures Into{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
            Smart Study Material
          </span>
        </h1>

        {/* Captivating description */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
          Upload your PDFs, PPTs, Word documents, and audio lecture recordings. Our Generative AI extracts key topics, writes clean comprehensive notes, creates 20+ flashcards, designs custom graded quizzes, and gives you a conversational chatbot companion.
        </p>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          <button
            onClick={() => navigateTo(isAuthenticated ? 'dashboard' : 'auth')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 transform active:scale-95 transition-all flex items-center justify-center space-x-2 group"
          >
            <span>Start Generating Free Notes</span>
            <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>

        {/* Features Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-16">
          
          <div className="glass-card p-6 sm:p-8 rounded-3xl border text-left flex flex-col space-y-4">
            <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-2xl w-fit">
              <Brain className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Deep Lecture Synthesis</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              We slice large transcripts and read layouts, generating headers, bullet points, core math equations, and analogies.
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-3xl border text-left flex flex-col space-y-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-2xl w-fit">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Active Recall Systems</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Reinforce learning with 20+ flashcards in question-answer format and full 10-question graded quizzes.
            </p>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-3xl border text-left flex flex-col space-y-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl w-fit">
              <MessageSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Conversational Chatbot</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Ask your notes questions like "Explain this formula" or "Give me another example" with persistent conversational history.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
