import React, { useState, useEffect, useRef } from 'react';
import { Send, GraduationCap, X, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Chatbot({ noteId, isOpen, onClose, darkMode }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState('');
  
  const chatEndRef = useRef(null);

  const fetchHistory = async () => {
    if (!noteId) return;
    setLoadingHistory(true);
    setError('');
    try {
      const data = await api.getChatHistory(noteId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error(err);
      setError('Could not load chat history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [noteId, isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend = inputMessage) => {
    if (!textToSend.trim() || loading) return;
    
    setError('');
    const userText = textToSend;
    setInputMessage('');

    // Append user message locally first
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      message: userText,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const reply = await api.sendChatMessage(noteId, userText);
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedPrompt = (promptText) => {
    handleSendMessage(promptText);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-96 z-50 glass-panel flex flex-col transition-all duration-300 border-l ${
      darkMode ? 'border-slate-900 shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : 'border-slate-200 shadow-xl shadow-slate-200'
    }`}>
      
      {/* Drawer Header */}
      <div className={`p-4 flex items-center justify-between border-b ${
        darkMode ? 'border-slate-900/60 bg-indigo-950/10' : 'border-slate-100 bg-indigo-50/10'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-500 text-white rounded-lg shadow shadow-indigo-150">
            <GraduationCap className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm ${darkMode ? 'text-slate-100' : 'text-slate-805'}`}>Study AI Chat</h3>
            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Context-Aware RAG</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-xl transition-colors ${
            darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-850'
          }`}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {loadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full space-y-2">
            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
            <span className="text-xs text-slate-400 font-bold">Recalling chat session...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-4">
            <HelpCircle className="h-10 w-10 text-indigo-500/60 animate-bounce" />
            <div>
              <p className={`text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-705'}`}>Ask your Study Buddy!</p>
              <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed font-semibold">
                I have memorized the entire lecture content. Ask me to explain concepts, summarize, or simplify definitions!
              </p>
            </div>
            
            {/* Suggested prompts list */}
            <div className="w-full space-y-2 pt-2">
              {[
                'Explain the core topic of this lecture',
                'Simplify the primary definition',
                'What are the critical exam concepts?'
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSuggestedPrompt(prompt)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold hover:border-indigo-500/40 hover:scale-[1.01] transition-all ${
                    darkMode 
                      ? 'border-slate-850 bg-slate-900/30 text-slate-300 hover:bg-slate-900' 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:shadow-sm'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Render messages list */
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm font-semibold ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-none shadow shadow-indigo-150'
                      : darkMode
                        ? 'bg-slate-900 text-slate-200 border-none rounded-bl-none'
                        : 'bg-slate-100 border border-slate-200/50 text-slate-750 rounded-bl-none shadow-sm shadow-slate-100'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <span className={`block text-[9px] mt-1.5 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className={`p-3.5 rounded-2xl rounded-bl-none flex items-center space-x-1.5 ${
                  darkMode ? 'bg-slate-900' : 'bg-slate-100'
                }`}>
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start space-x-2 text-rose-500 dark:text-rose-450 text-xs font-bold">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Suggested Quick Actions */}
      {messages.length > 0 && !loading && (
        <div className={`px-4 py-2 border-t flex space-x-1.5 overflow-x-auto scrollbar-none ${
          darkMode ? 'border-slate-900/60 bg-slate-950/20' : 'border-slate-100 bg-slate-50/20'
        }`}>
          {[
            'Explain simpler 💡',
            'Summarize key ideas 🔑',
            'Give analogy 🏗️'
          ].map((action) => (
            <button
              key={action}
              onClick={() => handleSuggestedPrompt(action.slice(0, -3))}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full border text-[10px] font-bold hover:border-indigo-400 hover:scale-[1.01] transition-all ${
                darkMode
                  ? 'bg-slate-900 border-slate-800 text-slate-355'
                  : 'bg-white border-slate-200 text-slate-600 shadow-sm shadow-slate-100'
              }`}
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Form */}
      <div className={`p-4 border-t ${
        darkMode ? 'border-slate-900 bg-slate-950/20' : 'border-slate-200 bg-slate-50/20'
      }`}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputMessage}
            disabled={loading}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your question..."
            className={`flex-grow p-3 border rounded-2xl text-sm focus:border-indigo-500 focus:outline-none font-bold ${
              darkMode 
                ? 'border-slate-850 bg-slate-900 text-slate-100' 
                : 'border-slate-200 bg-white text-slate-700 shadow-inner'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !inputMessage.trim()}
            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl shadow shadow-indigo-150 transform hover:scale-105 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </form>
      </div>

    </div>
  );
}
