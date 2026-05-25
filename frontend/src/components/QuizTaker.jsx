import React, { useState, useEffect, useRef } from 'react';
import { Award, AlertCircle, Timer, CheckCircle2, XCircle, Info, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function QuizTaker({ noteId, showToast, darkMode }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({}); // {question_id: selected_answer}
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // Score response
  const [error, setError] = useState('');
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes default
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef(null);

  const fetchQuiz = async (diff = difficulty) => {
    setLoading(true);
    setError('');
    setResult(null);
    setAnswers({});
    setTimeLeft(600);
    setTimerActive(false);
    
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      const data = await api.getQuiz(noteId, diff);
      setQuiz(data);
      setTimerActive(true);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [noteId]);

  // Handle countdown logic
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      handleSubmit(true); // Auto submit on timer end
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, timerActive]);

  const handleSelectAnswer = (qId, optionText) => {
    if (result) return; // Read-only after submit
    setAnswers((prev) => ({
      ...prev,
      [qId]: optionText,
    }));
  };

  const handleTextAnswerChange = (qId, val) => {
    if (result) return;
    setAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (submitting || result) return;
    setSubmitting(true);
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
      question_id: parseInt(qId),
      selected_answer: val,
    }));

    quiz.questions.forEach((q) => {
      if (answers[q.id] === undefined) {
        formattedAnswers.push({
          question_id: q.id,
          selected_answer: "",
        });
      }
    });

    try {
      const scoreData = await api.submitQuiz(quiz.id, formattedAnswers);
      setResult(scoreData);
      if (isAutoSubmit) {
        setError('Time limit reached! Your quiz was submitted automatically.');
        showToast('Quiz submitted automatically due to time limit.', 'info');
      } else {
        showToast(`Quiz completed! You scored ${scoreData.score}/${scoreData.total_questions}.`, 'success');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit quiz.');
      setTimerActive(true); // Restart timer
      showToast(err.message || 'Quiz submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    fetchQuiz(newDiff);
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 py-10 max-w-2xl mx-auto">
        <div className="shimmer-effect h-8 w-60 rounded-xl"></div>
        <div className="shimmer-effect h-40 w-full rounded-2xl"></div>
        <div className="shimmer-effect h-40 w-full rounded-2xl"></div>
      </div>
    );
  }

  if (error && !result) {
    return (
      <div className="text-center py-16 text-rose-500 font-semibold max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-4" />
        <p>{error}</p>
        <button 
          onClick={() => fetchQuiz()} 
          className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz) return null;

  return (
    <div className="max-w-2xl mx-auto py-2">
      
      {/* Header Info & Timer Dashboard */}
      {!result ? (
        <div className={`sticky top-16 z-30 glass-panel p-4 rounded-2xl border mb-6 flex items-center justify-between shadow-glass-light ${
          darkMode ? 'border-slate-900 bg-slate-900/80' : 'border-slate-200 bg-white/80'
        }`}>
          <div className="flex items-center space-x-2">
            <Timer className={`h-5 w-5 ${timeLeft < 60 ? 'text-rose-500 animate-bounce' : 'text-indigo-500'}`} />
            <span className={`font-mono font-bold text-base ${timeLeft < 60 ? 'text-rose-500 animate-pulse' : darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              Time Left: {formatTime(timeLeft)}
            </span>
          </div>

          <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {['easy', 'medium', 'hard'].map((d) => (
              <button
                key={d}
                onClick={() => handleDifficultyChange(d)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                  difficulty === d
                    ? darkMode
                      ? 'bg-slate-950 text-indigo-400 shadow-sm'
                      : 'bg-white text-indigo-600 shadow-sm shadow-slate-200'
                    : 'text-slate-450 hover:text-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Dynamic Score Screen */
        <div className={`glass-panel p-6 sm:p-8 rounded-3xl border shadow-glass-light text-center mb-8 ${
          darkMode 
            ? 'border-slate-900 bg-gradient-to-tr from-indigo-950/10 to-slate-900/10' 
            : 'border-slate-200 bg-gradient-to-tr from-indigo-50/20 to-white shadow shadow-slate-100'
        }`}>
          <Award className="h-14 w-14 text-indigo-500 mx-auto animate-float mb-4" />
          <h2 className={`text-2xl font-black ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>Quiz Completed!</h2>
          
          <div className="flex items-center justify-center space-x-6 my-6">
            <div className={`p-4 rounded-2xl border ${
              darkMode ? 'bg-indigo-950/30 border-indigo-900/50' : 'bg-indigo-50 border-indigo-100'
            }`}>
              <span className="block text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                {result.score} / {result.total_questions}
              </span>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1 block">Correct Answers</span>
            </div>
            
            <div className={`p-4 rounded-2xl border ${
              darkMode ? 'bg-emerald-950/30 border-emerald-900/50' : 'bg-emerald-50 border-emerald-100'
            }`}>
              <span className="block text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {result.percentage}%
              </span>
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mt-1 block">Score Percentage</span>
            </div>
          </div>

          <button
            onClick={() => fetchQuiz()}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow hover:scale-[1.02] transform active:scale-95 transition-all flex items-center justify-center space-x-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retake Quiz</span>
          </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-rose-450 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Quiz Questions List */}
      <div className="space-y-6 mb-8">
        {(result ? result.results : quiz.questions).map((q, idx) => {
          const qId = q.id || q.question_id;
          const studentAns = result ? q.student_answer : answers[qId];
          const isCorrect = result ? q.is_correct : null;
          
          return (
            <div 
              key={qId}
              className={`glass-panel p-6 sm:p-7 rounded-3xl border transition-all ${
                result
                  ? isCorrect
                    ? darkMode
                      ? 'border-emerald-950/50 bg-emerald-950/5'
                      : 'border-emerald-200 bg-emerald-50/10'
                    : darkMode
                      ? 'border-rose-950/50 bg-rose-950/5'
                      : 'border-rose-200 bg-rose-50/10'
                  : darkMode
                    ? 'border-slate-900'
                    : 'border-slate-200/80 bg-white shadow shadow-slate-100'
              }`}
            >
              <div className="flex items-start justify-between space-x-3 mb-5">
                <span className="px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/15 text-indigo-500 text-xs font-bold uppercase tracking-wider mt-0.5">
                  Question {idx + 1}
                </span>
                
                {result && (
                  <span className="flex items-center space-x-1">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-500" />
                    )}
                  </span>
                )}
              </div>

              <h3 className={`text-base font-extrabold mb-5 leading-relaxed ${darkMode ? 'text-slate-100' : 'text-slate-805'}`}>
                {q.question_text}
              </h3>

              {/* RENDER BY QUESTION TYPE */}
              {q.question_type === 'mcq' && q.options && (
                <div className="space-y-3">
                  {q.options.map((opt) => {
                    const isSelected = studentAns === opt;
                    const isCorrectOpt = result && opt === q.correct_answer;
                    
                    let btnClass = darkMode 
                      ? 'border-slate-900 hover:bg-slate-850/40 text-slate-300'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-650';
                    
                    if (isSelected && !result) {
                      btnClass = darkMode
                        ? 'border-indigo-500 bg-indigo-500/5 text-indigo-400 font-semibold shadow shadow-indigo-500/5'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-650 font-bold shadow-sm';
                    } else if (result) {
                      if (isCorrectOpt) {
                        btnClass = darkMode
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold shadow shadow-emerald-500/5'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-700 font-black shadow-sm';
                      } else if (isSelected && !isCorrect) {
                        btnClass = darkMode
                          ? 'border-rose-500 bg-rose-500/10 text-rose-450'
                          : 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAnswer(qId, opt)}
                        disabled={!!result}
                        className={`w-full text-left p-4 border rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between ${btnClass}`}
                      >
                        <span>{opt}</span>
                        {isSelected && !result && (
                          <div className="h-4.5 w-4.5 rounded-full border-4 border-indigo-500 bg-white"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'true_false' && (
                <div className="flex gap-4">
                  {['True', 'False'].map((opt) => {
                    const isSelected = studentAns === opt;
                    const isCorrectOpt = result && opt === q.correct_answer;
                    
                    let btnClass = darkMode 
                      ? 'border-slate-900 hover:bg-slate-850/40 text-slate-350'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-650';
                    
                    if (isSelected && !result) {
                      btnClass = darkMode
                        ? 'border-indigo-500 bg-indigo-500/5 text-indigo-400 font-bold shadow shadow-indigo-500/5'
                        : 'border-indigo-500 bg-indigo-50 text-indigo-650 font-extrabold shadow-sm';
                    } else if (result) {
                      if (isCorrectOpt) {
                        btnClass = darkMode
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-black shadow shadow-emerald-500/5'
                          : 'border-emerald-500 bg-emerald-50 text-emerald-700 font-black shadow-sm';
                      } else if (isSelected && !isCorrect) {
                        btnClass = darkMode
                          ? 'border-rose-500 bg-rose-500/10 text-rose-450'
                          : 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm';
                      }
                    }

                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleSelectAnswer(qId, opt)}
                        disabled={!!result}
                        className={`flex-1 p-4 border rounded-2xl text-xs sm:text-sm font-bold transition-all text-center ${btnClass}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.question_type === 'fill_blank' && (
                <div>
                  <input
                    type="text"
                    value={studentAns || ''}
                    disabled={!!result}
                    placeholder="Type your answer here..."
                    onChange={(e) => handleTextAnswerChange(qId, e.target.value)}
                    className={`w-full p-4 border rounded-2xl text-xs sm:text-sm font-semibold focus:border-indigo-500 focus:outline-none ${
                      darkMode ? 'border-slate-850 bg-slate-950 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800 shadow-inner'
                    }`}
                  />
                  {result && (
                    <div className="mt-3 text-[10px] font-bold flex items-center space-x-2">
                      <span className="text-slate-450">Correct:</span>
                      <span className="text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg">
                        {q.correct_answer}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {q.question_type === 'short_answer' && (
                <div>
                  <textarea
                    rows="3"
                    value={studentAns || ''}
                    disabled={!!result}
                    placeholder="Provide a brief explanation..."
                    onChange={(e) => handleTextAnswerChange(qId, e.target.value)}
                    className={`w-full p-4 border rounded-2xl text-xs sm:text-sm font-semibold focus:border-indigo-500 focus:outline-none ${
                      darkMode ? 'border-slate-850 bg-slate-950 text-slate-100' : 'border-slate-200 bg-slate-50 text-slate-800 shadow-inner'
                    }`}
                  />
                  {result && (
                    <div className="mt-3 space-y-2">
                      <div className="text-[10px] font-bold text-slate-450">Target Solution Pattern:</div>
                      <p className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/10">
                        {q.correct_answer}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Explanations dashboard dropdown */}
              {result && q.explanation && (
                <div className={`mt-5 p-4 rounded-2xl border flex items-start space-x-3 text-xs leading-relaxed ${
                  darkMode 
                    ? 'bg-slate-900/40 border-slate-800 text-slate-350' 
                    : 'bg-indigo-50/50 border-indigo-100/30 text-slate-650'
                }`}>
                  <Info className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className={`font-black uppercase tracking-wider block ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>Explanation:</span>
                    <p className="mt-1">{q.explanation}</p>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Submission Buttons */}
      {!result && (
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow rounded-2xl transform active:scale-95 transition-all flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Evaluating Answers...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4.5 w-4.5" />
              <span>Submit and Grade Quiz</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
