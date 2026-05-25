import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  BookOpen, HelpCircle, CheckSquare, MessageSquare, Copy, Check, Download, 
  ArrowLeft, Loader2, ListTodo, Eye, EyeOff, Sparkles, BookOpenCheck, 
  LayoutGrid, ChevronRight, Award, Compass, Heart, FileText, Globe, Printer, 
  ZoomIn, ZoomOut, Maximize2, Minimize2, Trash2, Calendar, ArrowRight, Sun, Moon 
} from 'lucide-react';
import { api } from '../services/api';
import FlashcardCard from '../components/FlashcardCard';
import QuizTaker from '../components/QuizTaker';
import Chatbot from '../components/Chatbot';

// Custom lightweight Syntax-Highlighting Code Block component
function CodeBlock({ code, lang, darkMode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulated elegant syntax highlighter tokenization for code snippets
  const tokenize = (text) => {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Keywords (JS/Python/SQL)
    const keywords = /\b(def|class|return|if|else|elif|for|while|import|from|as|const|let|var|function|async|await|try|except|catch|finally|public|private|void|int|float|string|bool|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE)\b/g;
    formatted = formatted.replace(keywords, `<span class="text-indigo-400 font-bold">$1</span>`);

    // Functions
    formatted = formatted.replace(/\b([a-zA-Z_]\w*)(?=\()/g, `<span class="text-amber-400 font-semibold">$1</span>`);

    // Strings
    formatted = formatted.replace(/(["'])(.*?)\1/g, `<span class="text-emerald-400 font-medium">"$2"</span>`);

    // Numbers
    formatted = formatted.replace(/\b(\d+)\b/g, `<span class="text-rose-400">$1</span>`);

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="code-block-editor font-mono text-xs leading-relaxed flex flex-col bg-slate-950 text-slate-200">
      {/* Code Editor Top Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold tracking-wider select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
          <span className="pl-2 font-mono text-[10px] lowercase text-slate-400">{lang || 'code'}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center space-x-1.5 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      
      {/* Code Snippet Scroll Area */}
      <div className="p-4 overflow-x-auto max-h-[350px] scrollbar-thin select-all">
        <pre className="m-0 font-mono"><code className="font-mono text-slate-300 leading-5 block">{tokenize(code)}</code></pre>
      </div>
    </div>
  );
}

// Custom Markdown Renderer supporting tables, list grouping, math equations, and Notion styled panels
function CustomMarkdown({ content, darkMode, fontSizeClass, fontWidthClass }) {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements = [];
  
  let listItems = [];
  let currentListType = null; // 'bullet' or 'numbered'
  
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];
  
  let inCodeBlock = false;
  let codeLang = '';
  let codeContent = [];

  let headerIndex = 0;

  // Inline formatting helper
  const parseInlineMarkdown = (text) => {
    let formatted = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Bold: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, `<strong class="font-extrabold text-indigo-650 dark:text-indigo-300">$1</strong>`);
    
    // Italic: *text*
    formatted = formatted.replace(/\*(.*?)\*/g, `<em class="italic">$1</em>`);
    
    // Inline code: `code`
    formatted = formatted.replace(/`(.*?)`/g, `<code class="px-1.5 py-0.5 rounded font-mono text-xs ${darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}">$1</code>`);
    
    // LaTeX Inline: $math$
    formatted = formatted.replace(/\$(.*?)\$/g, `<span class="font-mono px-1 py-0.5 rounded ${darkMode ? 'text-indigo-400 bg-indigo-950/20' : 'text-indigo-600 bg-indigo-50/50'}">$1</span>`);

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  const flushList = (key) => {
    if (listItems.length > 0) {
      if (currentListType === 'bullet') {
        renderedElements.push(
          <ul key={`list-${key}`} className={`list-disc pl-6 mb-6 space-y-2 text-sm sm:text-base leading-relaxed font-medium ${
            darkMode ? 'text-slate-350' : 'text-slate-600'
          }`}>
            {listItems.map((item, idx) => (
              <li key={`li-${key}-${idx}`}>{item}</li>
            ))}
          </ul>
        );
      } else {
        renderedElements.push(
          <ol key={`list-${key}`} className={`list-decimal pl-6 mb-6 space-y-2 text-sm sm:text-base leading-relaxed font-medium ${
            darkMode ? 'text-slate-350' : 'text-slate-600'
          }`}>
            {listItems.map((item, idx) => (
              <li key={`li-${key}-${idx}`}>{item}</li>
            ))}
          </ol>
        );
      }
      listItems = [];
      currentListType = null;
    }
  };

  const flushTable = (key) => {
    if (inTable) {
      renderedElements.push(
        <div key={`table-container-${key}`} className="notes-table-container">
          <table className="notes-table">
            {tableHeaders.length > 0 && (
              <thead>
                <tr>
                  {tableHeaders.map((h, idx) => (
                    <th key={`th-${idx}`}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rIdx) => (
                <tr key={`tr-${rIdx}`}>
                  {row.map((cell, cIdx) => (
                    <td key={`td-${rIdx}-${cIdx}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  };

  const flushCodeBlock = (key) => {
    if (inCodeBlock) {
      const codeStr = codeContent.join('\n');
      renderedElements.push(
        <CodeBlock 
          key={`code-${key}`} 
          code={codeStr} 
          lang={codeLang} 
          darkMode={darkMode} 
        />
      );
      codeContent = [];
      inCodeBlock = false;
      codeLang = '';
    }
  };

  // Helper to check for Devanagari text
  const isHindiText = (text) => {
    const devanagariRegex = /[\u0900-\u097F]/;
    return devanagariRegex.test(text);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code block fence processing
    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock(i);
      } else {
        flushList(i);
        flushTable(i);
        inCodeBlock = true;
        codeLang = trimmed.slice(3).toLowerCase() || 'text';
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // 2. Table parsing
    if (trimmed.startsWith('|')) {
      flushList(i);
      inTable = true;
      const cells = line.split('|')
        .map(c => c.trim())
        .filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // If table row is a dash divider (e.g. |---|---|), ignore it
      if (cells.every(c => c.startsWith('-'))) {
        continue;
      }

      if (tableHeaders.length === 0) {
        tableHeaders = cells.map(c => parseInlineMarkdown(c));
      } else {
        tableRows.push(cells.map(c => parseInlineMarkdown(c)));
      }
      continue;
    } else if (inTable) {
      flushTable(i);
    }

    // 3. Headings with dynamic anchor scrolling keys
    if (trimmed.startsWith('# ')) {
      flushList(i);
      const titleText = trimmed.slice(2);
      const headingId = `heading-${headerIndex++}`;
      renderedElements.push(
        <h1 
          key={i} 
          id={headingId}
          className={`text-2.5xl sm:text-3.5xl font-black mt-12 mb-6 pb-3 border-b tracking-tight leading-snug flex items-center ${
            darkMode ? 'text-white border-slate-900' : 'text-slate-850 border-slate-150'
          }`}
        >
          {parseInlineMarkdown(titleText)}
        </h1>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(i);
      const titleText = trimmed.slice(3);
      const headingId = `heading-${headerIndex++}`;
      renderedElements.push(
        <h2 
          key={i} 
          id={headingId}
          className={`text-xl sm:text-2.5xl font-bold mt-10 mb-5 tracking-tight pb-2 border-b border-indigo-500/10 flex items-center ${
            darkMode ? 'text-slate-100' : 'text-slate-800'
          }`}
        >
          {parseInlineMarkdown(titleText)}
        </h2>
      );
    } else if (trimmed.startsWith('### ')) {
      flushList(i);
      const titleText = trimmed.slice(4);
      const headingId = `heading-${headerIndex++}`;
      renderedElements.push(
        <h3 
          key={i} 
          id={headingId}
          className={`text-base sm:text-xl font-bold mt-8 mb-3 tracking-tight ${
            darkMode ? 'text-slate-200' : 'text-slate-750'
          }`}
        >
          {parseInlineMarkdown(titleText)}
        </h3>
      );
    } 
    // 4. Bullet lists
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      if (currentListType === 'numbered') {
        flushList(i);
      }
      currentListType = 'bullet';
      listItems.push(parseInlineMarkdown(trimmed.slice(2)));
    } 
    // 5. Numbered lists
    else if (/^\d+\.\s/.test(trimmed)) {
      if (currentListType === 'bullet') {
        flushList(i);
      }
      currentListType = 'numbered';
      listItems.push(parseInlineMarkdown(trimmed.replace(/^\d+\.\s/, '')));
    }
    // 6. Styled blockquotes & callouts (Notion-style alerts)
    else if (trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> [!IMPORTANT]')) {
      flushList(i);
      const isImportant = trimmed.includes('IMPORTANT');
      let quoteText = "";
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith('>')) {
        i++;
        quoteText += " " + lines[i].trim().slice(1).trim();
      }
      renderedElements.push(
        <div 
          key={i} 
          className={`p-6 rounded-2xl border mb-6 text-sm sm:text-base leading-relaxed ${
            isImportant
              ? darkMode
                ? 'bg-rose-500/5 border-rose-500/20 text-rose-350 shadow-[inset_0_1px_0_0_rgba(244,63,94,0.1)]'
                : 'bg-rose-50/50 border-rose-200 text-rose-800 shadow-sm'
              : darkMode
                ? 'bg-indigo-500/5 border-indigo-500/20 text-indigo-350 shadow-[inset_0_1px_0_0_rgba(99,102,241,0.1)]'
                : 'bg-indigo-50/55 border-indigo-150 text-indigo-900 shadow-sm'
          }`}
        >
          <div className="flex items-center space-x-2 mb-2 select-none">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
              isImportant
                ? 'bg-rose-500/10 text-rose-500'
                : 'bg-indigo-500/10 text-indigo-500'
            }`}>
              {isImportant ? '⚠️ Exam Focus' : '💡 Study Tip'}
            </span>
          </div>
          <div className="font-semibold leading-relaxed">
            {parseInlineMarkdown(quoteText || "Callout explanation text")}
          </div>
        </div>
      );
    } else if (trimmed.startsWith('>')) {
      flushList(i);
      renderedElements.push(
        <blockquote key={i} className={`border-l-4 pl-4 py-2.5 italic mb-6 leading-relaxed text-sm sm:text-base ${
          darkMode ? 'border-indigo-500/40 text-slate-400 bg-slate-900/10' : 'border-indigo-500/40 text-slate-550 bg-slate-50/40'
        }`}>
          {parseInlineMarkdown(trimmed.slice(1).trim())}
        </blockquote>
      );
    }
    // 7. Math equations standalone LaTeX blocks
    else if (trimmed.startsWith('$$')) {
      flushList(i);
      let formulaText = "";
      while (i + 1 < lines.length && !lines[i + 1].trim().startsWith('$$')) {
        i++;
        formulaText += " " + lines[i].trim();
      }
      if (lines[i + 1]?.trim().startsWith('$$')) i++; // skip close
      renderedElements.push(
        <div key={i} className="math-block font-mono text-indigo-500 text-sm select-all">
          {formulaText || 'E = mc²'}
        </div>
      );
    }
    // 8. Plain Paragraphs (with automatic Noto Sans Devanagari Hindi support!)
    else if (trimmed.length > 0) {
      flushList(i);
      const isHindi = isHindiText(trimmed);
      renderedElements.push(
        <p key={i} className={`mb-6 text-sm sm:text-[15.5px] leading-relaxed font-semibold ${
          isHindi ? 'notes-document-hindi text-slate-750 dark:text-slate-200' : 'text-slate-600 dark:text-slate-300'
        }`}>
          {parseInlineMarkdown(trimmed)}
        </p>
      );
    } else {
      flushList(i);
    }
  }

  // Final flush checks
  flushList(lines.length);
  flushTable(lines.length);
  flushCodeBlock(lines.length);

  return (
    <div className={`notes-document ${fontSizeClass} ${fontWidthClass} focus-transition space-y-1`}>
      {renderedElements}
    </div>
  );
}

export default function NotesViewer({ noteId, navigateTo, showToast, darkMode }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'flashcards', 'quiz'
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Workspace Reading preferences
  const [focusMode, setFocusMode] = useState(false);
  const [fontSize, setFontSize] = useState('md'); // 'sm', 'md', 'lg', 'xl'
  const [fontWidth, setFontWidth] = useState('std'); // 'std', 'wide', 'full'
  const [activeLang, setActiveLang] = useState('en');
  const [translating, setTranslating] = useState(false);

  // AI Prompt Follow-up states
  const [followupText, setFollowupText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleFollowupSubmit = async (queryToSubmit) => {
    const finalQuery = queryToSubmit || followupText;
    if (!finalQuery.trim()) {
      showToast('Please type a follow-up instruction.', 'info');
      return;
    }
    
    setIsUpdating(true);
    setFollowupText('');
    showToast('AI Study Buddy is editing and expanding notebook...', 'info');
    
    try {
      const updatedNote = await api.generateFollowup(note.id, finalQuery);
      setNote(updatedNote);
      showToast('Notebook updated successfully!', 'success');
    } catch (e) {
      showToast(e.message || 'Follow-up update failed.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Table of Contents & Scroll Spy anchors
  const [toc, setToc] = useState([]);
  const [activeHeader, setActiveHeader] = useState('');

  useEffect(() => {
    const fetchNote = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await api.getNote(noteId);
        setNote(data);
        setActiveLang(data.language || 'en');
      } catch (err) {
        setError(err.message || 'Failed to retrieve notes.');
      } finally {
        setLoading(false);
      }
    };
    fetchNote();
  }, [noteId]);

  // Generate Table of Contents
  useEffect(() => {
    if (note && note.content) {
      const parsedHeadings = [];
      const lines = note.content.split('\n');
      let index = 0;
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('# ') || trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
          const level = trimmed.startsWith('# ') ? 1 : trimmed.startsWith('## ') ? 2 : 3;
          const title = trimmed.replace(/^#+\s+/, '');
          parsedHeadings.push({
            level,
            title,
            id: `heading-${index++}`
          });
        }
      });
      setToc(parsedHeadings);
      if (parsedHeadings.length > 0) {
        setActiveHeader(parsedHeadings[0].id);
      }
    }
  }, [note]);

  // Scroll spy active header listener
  useEffect(() => {
    if (activeTab !== 'notes') return;

    const handleScroll = () => {
      if (toc.length === 0) return;
      
      let currentActive = toc[0].id;
      for (let i = 0; i < toc.length; i++) {
        const el = document.getElementById(toc[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200) {
            currentActive = toc[i].id;
          } else {
            break;
          }
        }
      }
      setActiveHeader(currentActive);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toc, activeTab]);

  const jumpToHeading = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // sticky header buffer
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActiveHeader(id);
    }
  };

  const handleCopy = () => {
    if (!note) return;
    navigator.clipboard.writeText(note.content);
    setCopied(true);
    showToast('Notes content copied as Markdown!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (!note) return;
    const printWindow = window.open('', '_blank');
    const contentHtml = `
      <html>
        <head>
          <title>${note.title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.8; }
            h1 { font-size: 32px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; color: #0f172a; margin-bottom: 24px; }
            h2 { font-size: 24px; margin-top: 36px; color: #1e293b; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; }
            h3 { font-size: 18px; margin-top: 24px; color: #334155; }
            p { font-size: 15px; margin-bottom: 18px; color: #475569; }
            ul, ol { padding-left: 24px; margin-bottom: 24px; }
            li { margin-bottom: 8px; font-size: 15px; color: #475569; }
            blockquote { border-left: 4px solid #6366f1; padding-left: 20px; font-style: italic; color: #64748b; margin: 24px 0; background: #f8fafc; padding: 12px 20px; border-radius: 4px; }
            .badge { background: #6366f1; color: white; border-radius: 4px; padding: 4px 10px; font-size: 11px; display: inline-block; font-weight: bold; text-transform: uppercase; margin-bottom: 16px; }
            pre { background: #0f172a; color: #cbd5e1; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; overflow-x: auto; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; }
            th { background: #f1f5f9; padding: 10px 14px; border: 1px solid #cbd5e1; font-weight: bold; }
            td { padding: 12px 14px; border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="badge">StudyAI Academic Notebook</div>
          <h1>${note.title}</h1>
          <div>${note.content.replace(/\n/g, '<br>')}</div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(contentHtml);
    printWindow.document.close();
  };

  const handleExportMarkdown = () => {
    if (!note) return;
    const element = document.createElement("a");
    const file = new Blob([note.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${note.title.toLowerCase().replace(/\s+/g, "_")}_notes.md`;
    document.body.appendChild(element);
    element.click();
    showToast('Markdown study guide exported successfully!', 'success');
  };

  // Mock translation switcher
  const handleTranslate = async (lang) => {
    if (lang === activeLang) return;
    setTranslating(true);
    showToast(`AI is translating notes to ${lang === 'hi' ? 'Hindi / हिंदी' : 'English'}...`, 'info');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1400));
      setActiveLang(lang);
      showToast(`Notes converted to ${lang === 'hi' ? 'Hindi' : 'English'} successfully.`, 'success');
    } catch (e) {
      showToast('Failed to translate notes.', 'error');
    } finally {
      setTranslating(false);
    }
  };

  const getTopicTags = () => {
    if (!note || !note.topics) return [];
    try {
      return JSON.parse(note.topics);
    } catch (e) {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center flex-grow py-36 space-y-4">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin" />
        <span className="text-sm font-semibold text-slate-400">Loading intelligent workspace...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-rose-500 font-semibold max-w-md mx-auto">
        <p>{error}</p>
        <button 
          onClick={() => navigateTo('dashboard')} 
          className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl cursor-pointer"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const topicTags = getTopicTags();

  // Dynamic width & font styles
  const fontClass = fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : fontSize === 'xl' ? 'text-xl' : 'text-base';
  const widthClass = fontWidth === 'wide' ? 'max-w-[1050px]' : fontWidth === 'full' ? 'max-w-none' : 'max-w-[850px]';

  return (
    <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow flex flex-col space-y-6 relative pb-16">
      
      {/* Top Navbar Actions */}
      <div className={`flex items-center justify-between border-b pb-4 select-none ${
        darkMode ? 'border-slate-900' : 'border-slate-150'
      }`}>
        <button
          onClick={() => navigateTo('dashboard')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all transform active:scale-95 cursor-pointer ${
            darkMode ? 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ArrowLeft className="h-4.5 w-4.5" />
          <span>Study Dashboard</span>
        </button>

        {/* Tab Controls (Notes, Flashcards, Quiz) */}
        <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-900/50 border border-slate-900' : 'bg-slate-100'}`}>
          {[
            { id: 'notes', label: 'Smart Notebook', icon: BookOpen },
            { id: 'flashcards', label: 'Recall Cards', icon: HelpCircle },
            { id: 'quiz', label: 'Practice Quiz', icon: ListTodo }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Floating Quick chat buddy */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-bold shadow transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Discuss Notebook</span>
        </button>
      </div>

      {/* Main Tab Content Canvas */}
      <div className="flex-grow">
        
        {/* TAB 1: Smart study notebook canvas */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            
            {/* Preferences Reader Toolbar (Notion AI inspired) */}
            <div className={`flex flex-wrap items-center justify-between gap-4 p-3 px-4 rounded-2xl border shadow-glass-light ${
              darkMode ? 'bg-slate-900/40 border-slate-900' : 'bg-white border-slate-150 shadow shadow-slate-100/50'
            }`}>
              {/* Focus mode control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFocusMode(!focusMode)}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    focusMode 
                      ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' 
                      : darkMode 
                        ? 'text-slate-400 hover:bg-slate-800 border border-transparent' 
                        : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                  title={focusMode ? "Disable Focus mode" : "Enable distraction-free focus mode"}
                >
                  {focusMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{focusMode ? 'Focus Active' : 'Focus Mode'}</span>
                </button>
              </div>

              {/* Reader customization blocks */}
              <div className="flex items-center flex-wrap gap-4 text-xs font-semibold text-slate-400">
                {/* Font width selector */}
                <div className="flex items-center space-x-1">
                  <span className="mr-1 select-none">Width:</span>
                  {[
                    { id: 'std', label: 'Standard' },
                    { id: 'wide', label: 'Wide' },
                    { id: 'full', label: 'Full' }
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => setFontWidth(w.id)}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        fontWidth === w.id
                          ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 font-bold'
                          : 'hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-250 dark:bg-slate-850 hidden sm:block"></div>

                {/* Font size picker */}
                <div className="flex items-center space-x-1">
                  <span className="mr-1 select-none">Size:</span>
                  {[
                    { id: 'sm', label: 'A-' },
                    { id: 'md', label: 'A' },
                    { id: 'lg', label: 'A+' },
                    { id: 'xl', label: 'A++' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFontSize(s.id)}
                      className={`px-2.5 py-1 rounded transition-colors font-mono cursor-pointer ${
                        fontSize === s.id
                          ? 'bg-slate-200 dark:bg-slate-800 text-indigo-500 dark:text-indigo-400 font-bold'
                          : 'hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <div className="h-4 w-px bg-slate-250 dark:bg-slate-850 hidden sm:block"></div>

                {/* Language Switcher */}
                <div className="flex items-center space-x-1">
                  <Globe className="h-3.5 w-3.5 mr-1" />
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'hi', label: 'हिंदी' }
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => handleTranslate(l.id)}
                      className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                        activeLang === l.id
                          ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold'
                          : 'hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Grid Canvas (Left Sticky Nav, Center Sheet, Right Sidebar) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* LEFT SIDEBAR: Sticky interactive Table of Contents */}
              {!focusMode && (
                <div className="lg:col-span-1 sticky top-6 space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-none hidden lg:block pr-2">
                  <div className={`p-5 rounded-2xl border flex flex-col ${
                    darkMode ? 'bg-slate-900/20 border-slate-900/60' : 'bg-white border-slate-200/60'
                  }`}>
                    <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                      <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Table of Contents</span>
                    </h3>

                    {toc.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">No sections detected in study notes.</p>
                    ) : (
                      <div className="space-y-1">
                        {toc.map((heading) => (
                          <button
                            key={heading.id}
                            onClick={() => jumpToHeading(heading.id)}
                            className={`w-full text-left text-xs font-semibold py-2 transition-all border-l-2 pl-3 cursor-pointer block truncate ${
                              activeHeader === heading.id
                                ? 'active-heading-toc'
                                : darkMode
                                  ? 'border-slate-850 text-slate-450 hover:text-slate-200 hover:border-slate-700'
                                  : 'border-slate-150 text-slate-500 hover:text-slate-850 hover:border-slate-300'
                            } ${
                              heading.level === 1 ? 'font-bold text-[13px]' : heading.level === 2 ? 'pl-5 text-slate-400 dark:text-slate-500' : 'pl-7 text-slate-350 dark:text-slate-600'
                            }`}
                          >
                            {heading.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* CENTER CANVAS: Premium Notion-style Notebook Sheet */}
              <div className={`flex flex-col space-y-6 focus-transition ${
                focusMode 
                  ? 'lg:col-span-4 max-w-4xl mx-auto w-full' 
                  : 'lg:col-span-2'
              }`}>
                {translating ? (
                  <div className={`p-16 rounded-3xl border text-center flex flex-col items-center justify-center space-y-4 shadow-glass-light min-h-[500px] ${
                    darkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-white border-slate-150'
                  }`}>
                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                    <div>
                      <h3 className={`font-bold text-base ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Translating Academic Content</h3>
                      <p className="text-xs text-slate-500 max-w-xs mt-1">
                        Our study AI is re-aligning language constructs and rendering Noto Sans Devanagari typography...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={`p-8 sm:p-12 rounded-3xl border shadow-glass-light relative select-text leading-relaxed ${
                    darkMode 
                      ? 'bg-slate-900/30 border-slate-900 shadow-[0_8px_40px_rgba(0,0,0,0.5)]' 
                      : 'bg-white border-slate-150 shadow-[0_8px_30px_rgba(15,23,42,0.03)]'
                  }`}>
                    
                    {/* Top metadata stats block */}
                    <div className={`flex items-center space-x-3 mb-6 pb-6 border-b text-[10px] sm:text-xs text-slate-450 font-bold uppercase tracking-wider ${
                      darkMode ? 'border-slate-900' : 'border-slate-100'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <BookOpenCheck className="h-3.5 w-3.5" />
                        <span>{note.content ? Math.max(1, Math.round(note.content.split(/\s+/).length / 200)) : 5} min read</span>
                      </span>
                      <span>•</span>
                      <span className="px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[9px]">
                        {activeLang === 'hi' ? 'Hindi / हिंदी' : 'English'}
                      </span>
                    </div>

                    {/* Giant primary title */}
                    <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug mb-8 ${
                      darkMode ? 'text-slate-100' : 'text-slate-850'
                    }`}>
                      {note.title}
                    </h1>

                    {/* Rich Formatted Markdown Content Canvas */}
                    <div className="prose dark:prose-invert max-w-none">
                      <CustomMarkdown 
                        content={note.content} 
                        darkMode={darkMode} 
                        fontSizeClass={fontClass}
                        fontWidthClass={widthClass}
                      />
                    </div>

                    {/* Follow-up Prompt Editor Workspace (Notion AI & ChatGPT Canvas style) */}
                    <div className={`mt-12 pt-8 border-t space-y-4 select-none ${
                      darkMode ? 'border-slate-800/60' : 'border-slate-100'
                    }`}>
                      <div className="flex items-center space-x-2">
                        <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                        <h4 className={`text-xs font-bold uppercase tracking-widest ${
                          darkMode ? 'text-indigo-400' : 'text-indigo-700'
                        }`}>
                          AI Follow-up Edit Assistant
                        </h4>
                      </div>
                      
                      <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                        Customize or expand this study notebook! Ask the AI to explain concepts simpler, write mock code snippets, generate diagrams, create mnemonic devices, or append interview prep questions.
                      </p>

                      {/* Quick follow-up preset chips */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {[
                          { label: '💡 Explain Simpler', query: 'Please rewrite the hardest concepts inside this note in extremely simple language with intuitive vocabulary.' },
                          { label: '🚀 Add Coding Examples', query: 'Please add rich practical code snippets, standard syntax templates, and technical explanations inside this guide.' },
                          { label: '🧠 Create Mnemonics', query: 'Please generate highly effective mnemonic devices, memorization tips, and study recommendations.' },
                          { label: '🔍 Generate Interview QA', query: 'Please generate 5 typical technical interview questions and highly structured answers at the bottom of these notes.' },
                          { label: '📋 Summarize Key Takeaways', query: 'Please compile a high-impact key takeaway bullet points card summarizing this notebook.' }
                        ].map((chip, idx) => (
                          <button
                            key={idx}
                            disabled={isUpdating}
                            onClick={() => handleFollowupSubmit(chip.query)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer transform active:scale-95 disabled:opacity-50 ${
                              darkMode 
                                ? 'bg-slate-950/60 border-slate-900 hover:bg-slate-900 text-slate-400 hover:text-slate-200' 
                                : 'bg-slate-50 border-slate-150 hover:bg-slate-100 text-slate-600 shadow-sm'
                            }`}
                          >
                            {chip.label}
                          </button>
                        ))}
                      </div>

                      {/* Dynamic input bar with send button */}
                      <div className="relative">
                        <div className={`flex items-center rounded-2xl border transition-all p-1.5 pr-2.5 ${
                          darkMode 
                            ? 'bg-slate-950/40 border-slate-900 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10' 
                            : 'bg-slate-50 border-slate-200 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/5'
                        }`}>
                          <input
                            type="text"
                            value={followupText}
                            onChange={(e) => setFollowupText(e.target.value)}
                            disabled={isUpdating}
                            placeholder="Ask AI to modify or add examples to this note..."
                            className="flex-grow bg-transparent border-none outline-none font-semibold text-xs sm:text-sm px-3 py-2 text-slate-700 dark:text-slate-200"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFollowupSubmit();
                            }}
                          />
                          <button
                            onClick={() => handleFollowupSubmit()}
                            disabled={isUpdating || !followupText.trim()}
                            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold shadow transform active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            <span>Apply Edit</span>
                          </button>
                        </div>

                        {/* Skeleton live editor loading indicator */}
                        {isUpdating && (
                          <div className="absolute inset-0 bg-slate-950/5 rounded-2xl flex items-center justify-center pointer-events-none select-none">
                            <span className="text-xs text-indigo-500 animate-pulse font-bold">AI Study Buddy is editing notes content...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR: AI Action Panel & Milestones */}
              {!focusMode && (
                <div className="lg:col-span-1 space-y-6 sticky top-6 hidden lg:block">
                  
                  {/* Milestones revision streaks */}
                  <div className={`p-5 rounded-2xl border shadow-glass-light flex flex-col ${
                    darkMode ? 'bg-slate-900/20 border-slate-900/60' : 'bg-white border-slate-200/60'
                  }`}>
                    <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5 mb-3.5 select-none">
                      <Award className="h-4 w-4" />
                      <span>Study Insight</span>
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1 select-none">
                          <span className={darkMode ? 'text-slate-350' : 'text-slate-650'}>Active Revision Completion</span>
                          <span className="text-indigo-500">65%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border flex items-center space-x-3 select-none ${
                        darkMode ? 'bg-indigo-950/15 border-indigo-950/40' : 'bg-indigo-50/25 border-indigo-100'
                      }`}>
                        <Sparkles className="h-4.5 w-4.5 text-indigo-500 animate-pulse flex-shrink-0" />
                        <span className={`text-[11px] leading-relaxed font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-850'}`}>
                          Review recall flashcards for this notebook to maximize exam retention.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Semantic Subject tags metadata filter */}
                  {topicTags.length > 0 && (
                    <div className={`p-5 rounded-2xl border shadow-glass-light ${
                      darkMode ? 'bg-slate-900/20 border-slate-900/60' : 'bg-white border-slate-200/60'
                    }`}>
                      <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3.5 select-none flex items-center gap-1.5">
                        <Compass className="h-4 w-4 text-indigo-500" />
                        <span>Semantic Tag Filters</span>
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {topicTags.map((tag, idx) => (
                          <span 
                            key={idx}
                            className={`px-2.5 py-1 rounded-xl text-[9px] font-bold uppercase tracking-wider select-none ${
                              tag.importance === 'High'
                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                : tag.importance === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                  : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                            }`}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Document Quick action list */}
                  <div className={`p-5 rounded-2xl border shadow-glass-light flex flex-col ${
                    darkMode ? 'bg-slate-900/20 border-slate-900/60' : 'bg-white border-slate-200/60'
                  }`}>
                    <h3 className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-3 select-none">
                      Workspace Actions
                    </h3>
                    <div className="space-y-1.5 text-xs font-bold">
                      <button
                        onClick={handleCopy}
                        className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                          darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Copy className="h-4 w-4" />
                          <span>Copy Markdown</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={handleExportMarkdown}
                        className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                          darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Export Markdown</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>

                      <button
                        onClick={handlePrint}
                        className={`w-full py-2.5 px-3 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                          darkMode ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Printer className="h-4 w-4" />
                          <span>Download PDF</span>
                        </span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Smart AI Recommendations Panel */}
                  <div className={`p-5 rounded-2xl border shadow-glass-light flex flex-col ${
                    darkMode ? 'bg-slate-900/20 border-slate-900/60' : 'bg-white border-slate-200/60'
                  }`}>
                    <h3 className="font-bold text-[10px] text-indigo-500 uppercase tracking-widest mb-3.5 select-none flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span>Smart Study Roadmap</span>
                    </h3>
                    <div className="space-y-3 text-xs leading-relaxed font-semibold">
                      <div className="flex items-start space-x-2.5">
                        <ChevronRight className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                          Recommended: Complete the **Syllabus Quiz** on this notebook to test your memory limits.
                        </span>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <ChevronRight className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                          Weak Areas detected: Concepts related to formulas. Review formulas block inside notes sheet.
                        </span>
                      </div>
                      <div className="flex items-start space-x-2.5">
                        <ChevronRight className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                        <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                          Study Path: Next, type *"Generate custom interview questions"* in the follow-up prompt editor.
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

        {/* TAB 2: Study Recall Flashcards */}
        {activeTab === 'flashcards' && (
          <div className="py-2">
            <FlashcardCard noteId={note.id} darkMode={darkMode} />
          </div>
        )}

        {/* TAB 3: Graded Practice Quiz Taker */}
        {activeTab === 'quiz' && (
          <div className="py-2">
            <QuizTaker noteId={note.id} showToast={showToast} darkMode={darkMode} />
          </div>
        )}

      </div>

      {/* Floating sliding chatbot drawer */}
      <Chatbot 
        noteId={note.id} 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        darkMode={darkMode}
      />

    </div>
  );
}
