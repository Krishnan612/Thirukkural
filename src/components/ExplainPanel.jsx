import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary.jsx';

function ExplainPanelContent({ kuralId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState('ta');
  const panelRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const currentLang = localStorage.getItem('lang') || 'ta';
    setLang(currentLang);

    const handleLangChange = (e) => {
      setLang(e.detail);
      if (isOpen) {
        loadExplanation(e.detail);
      } else {
        setExplanation(null); // Force reload on next open
      }
    };

    window.addEventListener('lang-change', handleLangChange);
    return () => {
      window.removeEventListener('lang-change', handleLangChange);
    };
  }, [kuralId, isOpen]);

  const loadExplanation = async (currentLang = lang) => {
    setLoading(true);
    setError(null);

    const cacheKey = `thirukkural_explain_${kuralId}_${currentLang}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setExplanation(JSON.parse(cached));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ kuralId, lang: currentLang })
      });

      if (!response.ok) {
        throw new Error(currentLang === 'ta' ? 'விளக்கத்தைப் பெறுவதில் பிழை ஏற்பட்டது.' : 'Failed to fetch explanation.');
      }

      const data = await response.json();
      localStorage.setItem(cacheKey, JSON.stringify(data));
      setExplanation(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (e) => {
    e.preventDefault();
    if (!isOpen && !explanation) {
      loadExplanation();
    }
    setIsOpen(!isOpen);
  };

  // Critically damped spring (no overshoot) for normal motion, or instant transition for reduced motion
  const transitionConfig = shouldReduceMotion 
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 350, damping: 30 };

  return (
    <div ref={panelRef} className="border border-paper-border dark:border-ink-border rounded-2xl bg-paper-card/45 dark:bg-ink-card/45 overflow-hidden shadow-sm">
      
      {/* Header Trigger Button */}
      <motion.button
        onPointerDown={handleToggle}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center justify-between p-5 text-left font-sans-tamil font-bold text-base sm:text-lg text-ink-bg dark:text-paper-bg cursor-pointer select-none focus:outline-none"
        aria-expanded={isOpen}
      >
        <span className="flex items-center space-x-3">
          <span className="text-xl">✨</span>
          <span>
            {lang === 'ta' ? 'குறளின் வாழ்வியல் விளக்கம்' : '✨ Explain this Kural'}
          </span>
        </span>
        <motion.span 
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={transitionConfig}
          className="inline-block"
        >
          ▼
        </motion.span>
      </motion.button>

      {/* Spring Animated Expansion Drawer */}
      <motion.div
        initial={false}
        animate={{ height: isOpen ? 'auto' : 0 }}
        transition={transitionConfig}
        className="overflow-hidden"
      >
        <div className="p-5 border-t border-paper-border dark:border-ink-border space-y-6 bg-paper-card/20 dark:bg-ink-card/20">
          
          {/* Loading Shimmer State */}
          {loading && (
            <div className="space-y-4 py-2" aria-busy="true" aria-label="Loading explanation">
              <div className="h-4 bg-paper-border dark:bg-ink-border rounded animate-pulse w-3/4"></div>
              <div className="h-20 bg-paper-border dark:bg-ink-border rounded animate-pulse"></div>
              <div className="h-20 bg-paper-border dark:bg-ink-border rounded animate-pulse"></div>
              <div className="h-10 bg-paper-border dark:bg-ink-border rounded animate-pulse w-1/2 mx-auto"></div>
            </div>
          )}

          {/* Error Message */}
          {error && !loading && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center space-x-3">
              <span>⚠️</span>
              <span>{error}</span>
              <button 
                onClick={() => loadExplanation()} 
                className="underline ml-auto font-bold cursor-pointer"
              >
                {lang === 'ta' ? 'மீண்டும் முயலவும்' : 'Retry'}
              </button>
            </div>
          )}

          {/* Structured AI Output */}
          {explanation && !loading && !error && (
            <div className="space-y-6">
              
              {explanation.narrative ? (
                <div className="text-sm sm:text-base text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed font-sans-tamil space-y-4">
                  {explanation.narrative.split('\n').map((para, idx) => {
                    if (!para.trim()) return null;
                    return <p key={idx}>{para}</p>;
                  })}
                </div>
              ) : (
                <>
                  {/* Hook */}
                  {explanation.hook && (
                    <p className="text-base sm:text-lg font-medium italic text-terracotta leading-relaxed border-l-4 border-terracotta/40 pl-4 py-1">
                      "{explanation.hook}"
                    </p>
                  )}

                  {/* Relatable Situation / Story */}
                  {explanation.situation && (
                    <div className="space-y-2">
                      <h5 className="text-xs tracking-wider uppercase font-bold text-ochre">
                        {lang === 'ta' ? '🎭 வாழ்வியல் சூழல் (The Situation)' : '🎭 The Situation'}
                      </h5>
                      <p className="text-sm sm:text-base text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed font-sans-tamil">
                        {explanation.situation}
                      </p>
                    </div>
                  )}

                  {/* Connection to Kural */}
                  {explanation.connection && (
                    <div className="space-y-2">
                      <h5 className="text-xs tracking-wider uppercase font-bold text-ochre">
                        {lang === 'ta' ? '🔗 குறளுடனான இணைப்பு (The Connection)' : '🔗 The Connection'}
                      </h5>
                      <p className="text-sm sm:text-base text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed italic bg-paper-bg/40 dark:bg-ink-bg/40 p-4 rounded-lg border-l-2 border-terracotta">
                        {explanation.connection}
                      </p>
                    </div>
                  )}

                  {/* Deeper Meaning */}
                  {explanation.deeperMeaning && (
                    <div className="space-y-2">
                      <h5 className="text-xs tracking-wider uppercase font-bold text-ochre">
                        {lang === 'ta' ? '🧠 ஆழமான பொருள் (Deeper Meaning)' : '🧠 Deeper Meaning'}
                      </h5>
                      <p className="text-sm sm:text-base text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed font-sans-tamil">
                        {explanation.deeperMeaning}
                      </p>
                    </div>
                  )}

                  {/* Modern Application */}
                  {explanation.modernApplication && (
                    <div className="space-y-2">
                      <h5 className="text-xs tracking-wider uppercase font-bold text-ochre">
                        {lang === 'ta' ? '🌱 நடைமுறைப் பயன்பாடு (Modern Application)' : '🌱 Modern Application'}
                      </h5>
                      <div className="text-sm sm:text-base text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed space-y-2">
                        {explanation.modernApplication.split('\n').map((line, i) => {
                          const cleanLine = line.replace(/^[0-9*.\s-]+\s*/, '');
                          if (!cleanLine.trim()) return null;
                          return (
                            <div key={i} className="flex items-start space-x-2">
                              <span className="text-terracotta select-none mt-0.5">✓</span>
                              <span>{cleanLine}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Memorable Takeaway */}
              {explanation.takeaway && (
                <div className="pt-4 border-t border-paper-border/50 dark:border-ink-border/50">
                  <div className="p-4 bg-terracotta/5 border border-terracotta/25 rounded-xl text-center shadow-inner">
                    <span className="block text-[10px] tracking-wider uppercase font-bold text-terracotta mb-1.5">
                      {lang === 'ta' ? '💭 முக்கியக் கருத்து (Takeaway)' : '💭 Takeaway'}
                    </span>
                    <p className="font-serif-tamil text-base sm:text-lg font-bold text-ink-bg dark:text-paper-bg leading-relaxed">
                      {explanation.takeaway}
                    </p>
                  </div>
                </div>
              )}
              
              {explanation.isOfflineDemo && (
                <div className="text-[10px] text-center text-ink-bg/40 dark:text-paper-bg/40 pt-2 font-mono">
                  {lang === 'ta' 
                    ? '*இது ஒரு ஆஃப்லைன் மாதிரி விளக்கம். நேரடி விளக்கங்களுக்கு .env கோப்பில் GEMINI_API_KEY ஐ உள்ளிடவும்.' 
                    : '*This is an offline demo explanation. For live responses, set GEMINI_API_KEY in your .env file.'}
                </div>
              )}

            </div>
          )}

        </div>
      </motion.div>

    </div>
  );
}

export function ExplainPanel({ kuralId }) {
  return (
    <ErrorBoundary>
      <ExplainPanelContent kuralId={kuralId} />
    </ErrorBoundary>
  );
}
