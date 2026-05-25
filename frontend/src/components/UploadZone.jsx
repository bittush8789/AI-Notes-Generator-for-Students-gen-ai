import React, { useState, useRef } from 'react';
import { Upload, FileText, Music, AlertCircle, Languages, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';

export default function UploadZone({ onUploadComplete, darkMode }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState('en');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);

  const allowedExtensions = ['pdf', 'docx', 'pptx', 'ppt', 'txt', 'mp3', 'wav', 'm4a', 'ogg'];

  const validateFile = (file) => {
    if (!file) return false;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError(`Unsupported file format. Please upload: ${allowedExtensions.join(', ')}`);
      setSelectedFile(null);
      return false;
    }
    setError('');
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const response = await api.uploadFile(selectedFile, language, (percent) => {
        setProgress(percent);
      });
      
      setSelectedFile(null);
      if (onUploadComplete) {
        onUploadComplete(response);
      }
    } catch (err) {
      setError(err.message || 'Processing failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isAudio = selectedFile && ['mp3', 'wav', 'm4a', 'ogg'].includes(selectedFile.name.split('.').pop().toLowerCase());

  return (
    <div className={`glass-panel p-6 sm:p-7 rounded-3xl border transition-all duration-350 relative overflow-hidden ${
      darkMode ? 'border-slate-900 shadow-[0_4px_30px_rgba(0,0,0,0.35)]' : 'border-slate-200/80 shadow-md shadow-slate-100'
    }`}>
      
      {/* Glow bulb */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
        darkMode ? 'bg-indigo-500/5' : 'bg-indigo-500/10'
      }`}></div>

      <div className="flex items-center space-x-3 mb-5">
        <div className={`p-2.5 rounded-xl border ${
          darkMode ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
        }`}>
          <Sparkles className="h-4.5 w-4.5 animate-float" />
        </div>
        <div>
          <h2 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-slate-105' : 'text-slate-800'}`}>Workspace Upload Center</h2>
          <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">Drag-and-drop lecture documents or audio recordings</p>
        </div>
      </div>

      {error && (
        <div className="mb-4.5 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex items-start space-x-3 text-rose-500 dark:text-rose-400 text-xs">
          <AlertCircle className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Dashed Drag & Drop Space */}
      {!uploading ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`relative rounded-3xl p-6 text-center cursor-pointer transition-all duration-300 border border-dashed ${
            dragActive
              ? 'bg-indigo-500/5 scale-[0.99] border-indigo-500'
              : darkMode
                ? 'bg-slate-950/20 hover:bg-slate-900/10 border-slate-900 hover:border-indigo-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-indigo-500/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.docx,.pptx,.ppt,.txt,.mp3,.wav,.m4a,.ogg"
          />
          
          <div className="flex flex-col items-center justify-center space-y-3.5">
            <div className={`p-3.5 border rounded-2xl shadow-inner animate-float ${
              darkMode ? 'bg-slate-950 border-slate-900 text-indigo-400' : 'bg-white border-slate-150 text-indigo-600'
            }`}>
              <Upload className="h-6 w-6" />
            </div>
            
            {selectedFile ? (
              <div className={darkMode ? 'text-slate-205' : 'text-slate-700'}>
                <span className="font-bold text-xs block truncate max-w-xs">{selectedFile.name}</span>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className={`text-xs font-bold leading-snug ${darkMode ? 'text-slate-300' : 'text-slate-650'}`}>
                  Drag & drop files here, or <span className="text-indigo-500 hover:underline">browse</span>
                </p>
                <p className="text-[9px] text-slate-500 uppercase font-semibold mt-1 tracking-wider">PDF, DOCX, PPTX, MP3 up to 50MB</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Dynamic Uploading & Parsing loading state */
        <div className={`rounded-3xl p-6 text-center border ${
          darkMode ? 'bg-slate-950/30 border-slate-900' : 'bg-slate-50 border-slate-150'
        }`}>
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
            <div className={`w-full max-w-xs rounded-full h-1.5 overflow-hidden ${
              darkMode ? 'bg-slate-900' : 'bg-slate-200'
            }`}>
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className={darkMode ? 'text-slate-200' : 'text-slate-700'}>
              <span className="font-bold text-xs">
                {progress < 100 ? `Uploading material (${progress}%)` : 'AI is reading & synthesizing details...'}
              </span>
              <p className="text-[9px] text-slate-500 font-bold uppercase mt-1.5">
                {isAudio 
                  ? 'Transcribing audio recording & extracting topic nodes...' 
                  : 'Synthesizing summaries, 20+ cards, and quizzes...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Language controls & compile button triggers */}
      {selectedFile && !uploading && (
        <div className={`mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t pt-4 ${
          darkMode ? 'border-slate-900/60' : 'border-slate-200/60'
        }`}>
          <div className="flex items-center space-x-3">
            <Languages className="h-4.5 w-4.5 text-indigo-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Output Language</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className={`mt-1 block w-32 rounded-xl border px-2 py-1 text-xs focus:border-indigo-500 focus:outline-none font-semibold ${
                  darkMode ? 'border-slate-900 bg-slate-950 text-slate-200' : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="en">English Notes</option>
                <option value="hi">Hindi Notes (हिंदी)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleUpload}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center"
          >
            <span>Compile Study Notes</span>
          </button>
        </div>
      )}
    </div>
  );
}
