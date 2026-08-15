import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary.jsx';

function LanguageToggleContent() {
  const [lang, setLang] = useState('ta');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('lang') || 'ta';
    setLang(stored);

    const handleLangChange = (e) => setLang(e.detail || 'ta');
    window.addEventListener('lang-change', handleLangChange);
    return () => window.removeEventListener('lang-change', handleLangChange);
  }, []);

  const toggleLang = (e) => {
    e.preventDefault();
    const nextLang = lang === 'ta' ? 'en' : 'ta';

    if (typeof window !== 'undefined') {
      localStorage.setItem('lang', nextLang);
      document.documentElement.setAttribute('lang', nextLang);
      window.dispatchEvent(new CustomEvent('lang-change', { detail: nextLang }));
    }

    setLang(nextLang);
  };

  return (
    <motion.button
      type="button"
      onPointerDown={toggleLang}
      whileTap={reduceMotion ? undefined : { scale: 0.96 }}
      whileHover={reduceMotion ? undefined : { y: -1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D2963B] bg-[#4A280F] px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-[#F9F0CF] shadow-[0_8px_18px_rgba(74,40,15,0.16)] transition-colors duration-200 hover:bg-[#6F3D12] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6B24F]/70"
      aria-label="Toggle language"
    >
      <span className="font-sans-tamil">{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
      <span className="text-[10px] opacity-70">|</span>
      <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
    </motion.button>
  );
}

export function LanguageToggle() {
  return (
    <ErrorBoundary>
      <LanguageToggleContent />
    </ErrorBoundary>
  );
}
