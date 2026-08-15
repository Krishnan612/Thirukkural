import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import paals from '../../data/paal.json';
import iyals from '../../data/iyal.json';
import adhigarams from '../../data/adhigaram.json';

export function BrowseTree() {
  const [selectedPaalId, setSelectedPaalId] = useState(1);
  const [selectedIyalId, setSelectedIyalId] = useState(null);
  const [lang, setLang] = useState('ta');
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const currentLang = localStorage.getItem('lang') || 'ta';
    setLang(currentLang);

    const handleLangChange = (e) => setLang(e.detail);
    window.addEventListener('lang-change', handleLangChange);

    // Auto-select first iyal when paal changes
    const filteredIyals = iyals.filter(iy => iy.paalId === selectedPaalId);
    if (filteredIyals.length > 0) {
      setSelectedIyalId(filteredIyals[0].id);
    }

    return () => {
      window.removeEventListener('lang-change', handleLangChange);
    };
  }, [selectedPaalId]);

  const activePaal = paals.find(p => p.id === selectedPaalId);
  const filteredIyals = iyals.filter(iy => iy.paalId === selectedPaalId);
  const filteredAdhigarams = adhigarams.filter(ad => ad.paalId === selectedPaalId && ad.iyalId === selectedIyalId);

  return (
    <div className="space-y-8 animate-fade-in font-sans-tamil">
      
      {/* 1. Paal (Section) Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paals.map((p) => {
          const isSelected = p.id === selectedPaalId;
          return (
            <motion.button
              key={p.id}
              onClick={() => setSelectedPaalId(p.id)}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={reduceMotion ? undefined : { once: true, amount: 0.25 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className={`p-6 text-left rounded-xl border transition-all duration-300 flex flex-col justify-between cursor-pointer focus:outline-none focus:ring-2 focus:ring-terracotta ${
                isSelected
                  ? 'bg-terracotta/5 border-terracotta dark:border-terracotta shadow-md'
                  : 'bg-paper-card dark:bg-ink-card border-paper-border dark:border-ink-border hover:border-ochre/55'
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl select-none">
                    {p.id === 1 ? '⚖️' : p.id === 2 ? '👑' : '💘'}
                  </span>
                  <span className={`text-[10px] tracking-widest font-mono uppercase font-bold px-2 py-0.5 rounded ${
                    isSelected ? 'bg-terracotta/10 text-terracotta' : 'bg-ochre/10 text-ochre'
                  }`}>
                    {p.slug}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold font-serif-tamil text-ink-bg dark:text-paper-bg">
                  {lang === 'ta' ? p.nameTamil : p.nameEnglish}
                </h3>
                
                <p className="mt-2.5 text-xs text-ink-bg/70 dark:text-paper-bg/70 leading-relaxed line-clamp-3">
                  {lang === 'ta' ? p.descriptionTamil : p.descriptionEnglish}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-paper-border/60 dark:border-ink-border/60 flex items-center justify-between text-[11px] font-bold text-ink-bg/50 dark:text-paper-bg/50">
                <span>{lang === 'ta' ? `${p.iyalCount} இயல்கள்` : `${p.iyalCount} Sections`}</span>
                <span>•</span>
                <span>{lang === 'ta' ? `${p.adhigaramCount} அதிகாரங்கள்` : `${p.adhigaramCount} Chapters`}</span>
                <span>•</span>
                <span>{lang === 'ta' ? `${p.kuralCount} குறள்கள்` : `${p.kuralCount} Verses`}</span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 2. Bento Panel: Iyal (Sub-sections) on left, Adhigarams (Chapters) on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Iyals List */}
        <div className="lg:col-span-4 space-y-3">
          <h4 className="text-xs tracking-wider uppercase font-bold text-ochre pl-2">
            {lang === 'ta' ? "இயல்கள் (Sections)" : "Iyals (Sub-sections)"}
          </h4>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredIyals.map((iy) => {
              const isSelected = iy.id === selectedIyalId;
              return (
                <button
                  key={iy.id}
                  onClick={() => setSelectedIyalId(iy.id)}
                  className={`w-full p-4 text-left rounded-lg border transition-all duration-200 flex justify-between items-center cursor-pointer ${
                    isSelected
                      ? 'bg-ochre/10 border-ochre text-ochre font-bold shadow-sm'
                      : 'bg-paper-card dark:bg-ink-card border-paper-border/70 dark:border-ink-border/70 hover:bg-paper-card/70 hover:border-paper-border text-ink-bg dark:text-paper-bg'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-serif-tamil text-sm sm:text-base leading-tight">
                      {lang === 'ta' ? iy.nameTamil : iy.nameEnglish}
                    </span>
                    <span className="text-[10px] mt-1 text-ink-bg/50 dark:text-paper-bg/50 font-normal">
                      {lang === 'ta' ? `${iy.adhigaramCount} அதிகாரங்கள்` : `${iy.adhigaramCount} Chapters`}
                    </span>
                  </div>
                  <span className="text-xs opacity-75">➔</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Adhigarams Grid */}
        <div className="lg:col-span-8 space-y-3">
          <h4 className="text-xs tracking-wider uppercase font-bold text-ochre pl-2">
            {lang === 'ta' ? "அதிகாரங்கள் (Chapters)" : "Adhigarams (Chapters)"}
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1">
            {filteredAdhigarams.map((ad) => {
              return (
                <motion.a
                  key={ad.id}
                  href={`/adhigaram/${ad.id}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={reduceMotion ? undefined : { once: true, amount: 0.2 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24, delay: ad.id * 0.02 }}
                  className="p-4 bg-paper-card dark:bg-ink-card border border-paper-border dark:border-ink-border hover:border-terracotta/60 rounded-lg hover:shadow-sm transition-all duration-300 flex items-start space-x-3 group cursor-pointer"
                >
                  <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded bg-terracotta/10 text-terracotta text-xs font-mono font-bold group-hover:bg-terracotta group-hover:text-white transition-colors duration-200">
                    {ad.id}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-serif-tamil font-bold text-ink-bg dark:text-paper-bg group-hover:text-terracotta transition-colors duration-150">
                      {ad.nameTamil}
                    </span>
                    <span className="text-xs text-ink-bg/60 dark:text-paper-bg/60 leading-normal mt-0.5">
                      {ad.nameEnglish}
                    </span>
                    <span className="text-[10px] text-ochre mt-1">
                      {lang === 'ta' 
                        ? `குறள் ${ad.kuralRange.start} - ${ad.kuralRange.end}` 
                        : `Verses ${ad.kuralRange.start} - ${ad.kuralRange.end}`}
                    </span>
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
