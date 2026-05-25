import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, CheckCircle, Flame } from 'lucide-react';
import { api } from '../services/api';

export default function FlashcardCard({ noteId, darkMode }) {
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [knownCards, setKnownCards] = useState(new Set()); // Track master cards

  const fetchCards = async (diff = difficulty) => {
    setLoading(true);
    setError('');
    setIsFlipped(false);
    try {
      const data = await api.getFlashcards(noteId, diff);
      setCards(data);
      setCurrentIndex(0);
    } catch (err) {
      setError(err.message || 'Failed to fetch flashcards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [noteId]);

  const handleDifficultyChange = (newDiff) => {
    setDifficulty(newDiff);
    fetchCards(newDiff);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const toggleKnown = (idx) => {
    const next = new Set(knownCards);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setKnownCards(next);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="shimmer-effect h-60 w-full max-w-lg rounded-3xl mb-6"></div>
        <div className="shimmer-effect h-8 w-40 rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-rose-500 font-semibold">
        <p>{error}</p>
        <button 
          onClick={() => fetchCards()} 
          className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 font-semibold">
        No flashcards available for this note.
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center max-w-xl mx-auto py-4">
      
      {/* Settings / Difficulty Level Tabs */}
      <div className="flex items-center justify-between w-full mb-6">
        <span className="text-sm font-bold text-slate-500">Target Difficulty:</span>
        <div className={`flex p-1 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
          {['easy', 'medium', 'hard'].map((d) => (
            <button
              key={d}
              onClick={() => handleDifficultyChange(d)}
              className={`px-3.5 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
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

      {/* 3D Flipping Card Body */}
      <div 
        onClick={() => setIsFlipped(!isFlipped)}
        className="w-full h-80 perspective-1000 cursor-pointer group mb-6"
      >
        <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Card Front: Question */}
          <div className={`absolute inset-0 w-full h-full border rounded-3xl p-8 flex flex-col justify-between shadow-glass-light backface-hidden transition-all ${
            darkMode 
              ? 'bg-slate-900 border-slate-800' 
              : 'bg-white border-slate-200/80 shadow-md shadow-slate-100'
          }`}>
            <div className="flex justify-between items-center text-xs font-bold tracking-wider text-indigo-500 uppercase">
              <span className="flex items-center space-x-1.5 animate-float">
                <Flame className="h-4 w-4 fill-indigo-500/10" />
                <span>Question {currentIndex + 1}</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                darkMode ? 'bg-indigo-950/30' : 'bg-indigo-50'
              }`}>{currentCard.difficulty}</span>
            </div>
            
            <div className="text-center my-auto">
              <h3 className={`text-lg sm:text-xl font-bold leading-relaxed px-2 transition-all ${
                darkMode ? 'text-slate-100' : 'text-slate-800'
              }`}>
                {currentCard.question}
              </h3>
            </div>
            
            <div className="flex justify-center items-center text-xs text-slate-400 space-x-1.5 font-bold">
              <RotateCw className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} />
              <span>Tap to Flip and Reveal Answer</span>
            </div>
          </div>

          {/* Card Back: Answer */}
          <div className={`absolute inset-0 w-full h-full border rounded-3xl p-8 flex flex-col justify-between rotate-y-180 backface-hidden transition-all ${
            darkMode 
              ? 'bg-gradient-to-tr from-indigo-950/20 to-slate-900 border-slate-800' 
              : 'bg-gradient-to-tr from-indigo-50/20 to-white border-slate-200 shadow-md shadow-slate-100'
          }`}>
            <div className="flex justify-between items-center text-xs font-bold tracking-wider text-emerald-500 uppercase">
              <span className="flex items-center space-x-1.5">
                <CheckCircle className="h-4 w-4 fill-emerald-500/10" />
                <span>Explaining Answer</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50'
              }`}>Mastered</span>
            </div>
            
            <div className="my-auto overflow-y-auto max-h-48 pr-2">
              <p className={`text-sm sm:text-base font-semibold leading-relaxed ${
                darkMode ? 'text-slate-200' : 'text-slate-700'
              }`}>
                {currentCard.answer}
              </p>
            </div>
            
            <div className={`flex items-center justify-between border-t pt-4 ${
              darkMode ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleKnown(currentIndex);
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  knownCards.has(currentIndex)
                    ? 'bg-emerald-500 text-white shadow shadow-emerald-500/15'
                    : darkMode
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-650 hover:bg-slate-200'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                <span>{knownCards.has(currentIndex) ? 'Got it!' : 'Mark as Mastered'}</span>
              </button>
              
              <span className="text-xs text-slate-400 font-bold">Click to Flip Back</span>
            </div>
          </div>

        </div>
      </div>

      {/* Navigation Buttons & Progress Meter */}
      <div className={`w-full flex items-center justify-between p-4 border rounded-2xl ${
        darkMode 
          ? 'bg-slate-900/30 border-slate-850' 
          : 'bg-white border-slate-200/80 shadow-sm shadow-slate-100/50'
      }`}>
        <button
          onClick={handlePrev}
          className={`p-3 border rounded-xl hover:scale-105 active:scale-95 transition-all ${
            darkMode 
              ? 'bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-750' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        
        <div className="text-center flex flex-col items-center">
          <span className={`text-sm font-extrabold ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
            Card {currentIndex + 1} of {cards.length}
          </span>
          <span className="text-xs font-bold text-slate-450 mt-0.5">
            {knownCards.size} mastered
          </span>
        </div>

        <button
          onClick={handleNext}
          className={`p-3 border rounded-xl hover:scale-105 active:scale-95 transition-all ${
            darkMode 
              ? 'bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-750' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>

      {/* Progress Bars */}
      <div className="w-full mt-6 space-y-3">
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
          darkMode ? 'bg-slate-800' : 'bg-slate-200'
        }`}>
          <div 
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        
        {cards.length > 0 && (
          <div className="flex justify-between items-center text-xs font-bold text-slate-450">
            <span>Overall Session Progress</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
