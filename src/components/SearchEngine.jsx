import React, { useState, useEffect, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const POPULAR_THEMES = [
  { id: 'career', labelTa: '💼 தொழில் / வாழ்க்கைப்பாதை', labelEn: '💼 Career & Profession' },
  { id: 'learning', labelTa: '📚 கல்வி / கற்றல்', labelEn: '📚 Learning & Education' },
  { id: 'wisdom', labelTa: '🧠 அறிவு / மெய்யுணர்வு', labelEn: '🧠 Wisdom & Truth' },
  { id: 'humility', labelTa: '🙏 பணிவு / அடக்கம்', labelEn: '🙏 Humility & Virtue' },
  { id: 'relationships', labelTa: '❤️ உறவுகள் / நட்பு', labelEn: '❤️ Relationships & Friendship' },
  { id: 'peace', labelTa: '🧘 மனஅமைதி / பொறுமை', labelEn: '🧘 Peace & Patience' },
  { id: 'personal-growth', labelTa: '🌱 சுய முன்னேற்றம்', labelEn: '🌱 Personal Growth' },
];

export function SearchEngine({ kurals }) {
  const [query, setQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [lang, setLang] = useState('ta');
  const [visibleCount, setVisibleCount] = useState(15);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const currentLang = localStorage.getItem('lang') || 'ta';
    setLang(currentLang);

    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('lang-change', handleLangChange);

    // Read query param on load if redirected from home
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const t = params.get('theme');
    if (q) setQuery(q);
    if (t) setSelectedTheme(t);

    return () => {
      window.removeEventListener('lang-change', handleLangChange);
    };
  }, []);

  // Sync state to URL search parameters without page reload
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedTheme) params.set('theme', selectedTheme);
    const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState(null, '', newRelativePathQuery);
    
    // Reset pagination when search query or theme filter changes
    setVisibleCount(15);
  }, [query, selectedTheme]);

  // Performs optimized search matching
  const filteredKurals = useMemo(() => {
    let result = kurals;

    // 1. Filter by theme if selected
    if (selectedTheme) {
      result = result.filter(k => 
        k.themes.includes(selectedTheme) || 
        k.lifeApps.includes(selectedTheme)
      );
    }

    // 2. Search query filter
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return result;

    // Check if query is just a Kural number
    const num = parseInt(trimmed, 10);
    if (!isNaN(num) && num >= 1 && num <= 1330) {
      return result.filter(k => k.id === num);
    }

    // Text search
    return result.filter(k => {
      const idMatch = k.id.toString() === trimmed;
      const textMatch = 
        k.line1.toLowerCase().includes(trimmed) || 
        k.line2.toLowerCase().includes(trimmed) ||
        (k.trans1 && k.trans1.toLowerCase().includes(trimmed)) ||
        (k.trans2 && k.trans2.toLowerCase().includes(trimmed));
      const meaningMatch = 
        k.meaningTa.toLowerCase().includes(trimmed) || 
        k.meaningEn.toLowerCase().includes(trimmed);
      const themeMatch = 
        k.themes.some(t => t.toLowerCase().includes(trimmed)) || 
        k.lifeApps.some(l => l.toLowerCase().includes(trimmed));
      const keywordMatch = k.keywords && k.keywords.some(kw => kw.toLowerCase().includes(trimmed));

      return idMatch || textMatch || meaningMatch || themeMatch || keywordMatch;
    });
  }, [kurals, query, selectedTheme]);

  const displayedKurals = filteredKurals.slice(0, visibleCount);

  return (
    <div className="space-y-8 animate-fade-in font-sans-tamil">
      
      {/* Search Input Card */}
      <div className="p-6 bg-paper-card dark:bg-ink-card border border-paper-border dark:border-ink-border rounded-2xl shadow-sm space-y-4">
        <label htmlFor="search-input" className="block text-sm font-bold text-ochre tracking-wide">
          {lang === 'ta' ? 'குறள் எண், சொல், அல்லது கருப்பொருள் கொண்டு தேடுக' : 'Search by Kural Number, Word, or Theme'}
        </label>
        
        <div className="relative flex items-center">
          <input
            id="search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'ta' ? 'உதாரணமாக: கல்வி, வாய்மை, 12, career...' : 'Try: wisdom, learning, 12, friendship...'}
            className="w-full pl-12 pr-10 py-3 sm:py-4 rounded-xl border border-paper-border dark:border-ink-border bg-paper-bg dark:bg-ink-bg text-ink-bg dark:text-paper-bg focus:ring-2 focus:ring-terracotta focus:border-terracotta transition-all duration-200 outline-none text-base"
          />
          <span className="absolute left-4 text-xl opacity-60 select-none">🔍</span>
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 p-1 rounded-full hover:bg-paper-border/30 text-ink-bg/60 dark:text-paper-bg/60 cursor-pointer"
              title={lang === 'ta' ? 'அழி' : 'Clear'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Life Application / Theme Filter Badges */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-ink-bg/50 dark:text-paper-bg/50 uppercase tracking-wider">
            {lang === 'ta' ? 'வாழ்வியல் தலைப்புகள் (Life Applications)' : 'Filter by Life Application'}
          </span>
          <div className="flex flex-wrap gap-2">
            {POPULAR_THEMES.map((theme) => {
              const isActive = selectedTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(isActive ? null : theme.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer select-none ${
                    isActive
                      ? 'bg-terracotta border-terracotta text-white font-bold scale-105'
                      : 'bg-paper-bg dark:bg-ink-bg border-paper-border dark:border-ink-border text-ink-bg/75 dark:text-paper-bg/75 hover:border-terracotta/60'
                  }`}
                >
                  {lang === 'ta' ? theme.labelTa : theme.labelEn}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Title Info */}
      <div className="flex justify-between items-center text-sm text-ink-bg/60 dark:text-paper-bg/60 border-b border-paper-border dark:border-ink-border pb-3">
        <span>
          {lang === 'ta' 
            ? `தேடல் முடிவுகள்: ${filteredKurals.length} குறள்கள்` 
            : `Matches found: ${filteredKurals.length} verses`}
        </span>
        {selectedTheme && (
          <button 
            onClick={() => setSelectedTheme(null)} 
            className="text-xs text-terracotta hover:underline font-bold cursor-pointer"
          >
            {lang === 'ta' ? 'வடிப்பானை நீக்கு ✕' : 'Clear Filter ✕'}
          </button>
        )}
      </div>

      {/* Search Results List */}
      <div className="space-y-6">
        {displayedKurals.map((k, index) => (
          <motion.div
            key={k.id}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={reduceMotion ? undefined : { once: true, amount: 0.15 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: Math.min(index * 0.08, 0.36) }}
            className="p-6 bg-paper-card dark:bg-ink-card border border-paper-border dark:border-ink-border rounded-xl hover:shadow-sm hover:border-terracotta/40 transition-all duration-300 animate-fade-in"
          >
            <div className="flex justify-between items-start mb-4">
              <span className="px-2.5 py-0.5 text-xs font-bold bg-ochre/10 text-ochre rounded-full font-mono">
                {lang === 'ta' ? `குறள் ${k.id}` : `Verse ${k.id}`}
              </span>
              <a
                href={`/kural/${k.id}`}
                className="text-xs font-bold text-terracotta hover:underline"
              >
                {lang === 'ta' ? 'முழு விபரம் ➔' : 'View Full Details ➔'}
              </a>
            </div>

            <p className="font-serif-tamil text-lg sm:text-xl font-bold leading-relaxed mb-4 text-ink-bg dark:text-paper-bg">
              {k.line1} <br />
              {k.line2}
            </p>

            <p className="text-sm sm:text-base text-ink-bg/85 dark:text-paper-bg/85 border-l-2 border-ochre/40 pl-3 leading-relaxed mb-4">
              {lang === 'ta' ? k.meaningTa : k.meaningEn}
            </p>

            {/* Badges for themes */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-paper-border/50 dark:border-ink-border/50">
              {k.themes.slice(0, 3).map(theme => (
                <span 
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-paper-bg dark:bg-ink-bg border border-paper-border dark:border-ink-border text-ink-bg/60 dark:text-paper-bg/60 hover:border-terracotta hover:text-terracotta transition-colors duration-150 cursor-pointer select-none"
                >
                  #{theme}
                </span>
              ))}
            </div>
          </motion.div>
        ))}

        {filteredKurals.length === 0 && (
          <div className="text-center py-16 bg-paper-card dark:bg-ink-card border border-paper-border dark:border-ink-border rounded-xl p-8 max-w-lg mx-auto">
            <span className="text-4xl select-none font-normal">🔍</span>
            <h3 className="mt-4 text-xl font-bold font-sans-tamil">
              {lang === 'ta' ? 'முடிவுகள் ஏதுமில்லை' : 'No results found'}
            </h3>
            <p className="mt-2 text-sm text-ink-bg/60 dark:text-paper-bg/60">
              {lang === 'ta' 
                ? 'வேறு சொற்களைப் பயன்படுத்தித் தேடவும் அல்லது வடிப்பான்களை மாற்றவும்.' 
                : 'Try checking your spelling, changing filters, or using different keywords.'}
            </p>
          </div>
        )}

        {/* Load More Button */}
        {filteredKurals.length > visibleCount && (
          <div className="text-center pt-4">
            <button
              onClick={() => setVisibleCount(prev => prev + 15)}
              className="px-6 py-2.5 bg-paper-card dark:bg-ink-card border border-paper-border dark:border-ink-border text-ink-bg dark:text-paper-bg hover:border-terracotta rounded-lg font-semibold transition-colors duration-200 cursor-pointer"
            >
              {lang === 'ta' ? 'மேலும் காட்டுக' : 'Load More'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
