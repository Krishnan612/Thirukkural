import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary.jsx';

function AIPopupContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState('lang'); // 'lang' | 'mode' | 'site-guide' | 'kural-explain' | 'site-answer' | 'kural-result'
  const [chatLang, setChatLang] = useState(null); // 'ta' | 'en'
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [kuralNumber, setKuralNumber] = useState('');
  const [kuralError, setKuralError] = useState(null);
  
  // Loading & Result States for Kural Explanation
  const [loading, setLoading] = useState(false);
  const [kuralData, setKuralData] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [apiError, setApiError] = useState(null);

  const shouldReduceMotion = useReducedMotion();
  const popupRef = useRef(null);

  // Close popup on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        // Do not close if clicking the floating action button itself
        const fab = document.getElementById('ai-fab-button');
        if (fab && fab.contains(event.target)) return;
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Static FAQ Content Map for Site Guide Mode
  const faqs = {
    search: {
      q: {
        ta: "குறள்களை எவ்வாறு தேடுவது?",
        en: "How do I search for a Kural?"
      },
      a: {
        ta: "தேடல் பக்கத்தில் சொல், குறள் எண், அல்லது 'கல்வி', 'அன்பு' போன்ற வாழ்வியல் தலைப்புகள் கொண்டு தேடலாம். மேலும் Filter Badges ஐப் பயன்படுத்தி எளிதாக வடிகட்டலாம்.",
        en: "Go to the Search page. You can search by Kural number, word, or life application themes like 'learning', 'wisdom', 'relationships'. Click Filter Badges to narrow search results instantly."
      }
    },
    save: {
      q: {
        ta: "விருப்பங்களை சேமிப்பது எப்படி?",
        en: "How do I save a Kural?"
      },
      a: {
        ta: "ஒவ்வொரு குறள் பக்கத்திலும் வலதுபுறம் உள்ள '💖' (இதயம்) குறியீட்டை அழுத்தி சேமிக்கலாம். சேமித்த குறள்களை 'விருப்பங்கள்' பக்கத்தில் காணலாம்.",
        en: "Click the '💖' (Heart) button on any individual Kural page to save it. You can access all your saved couplets in the 'Favorites' tab."
      }
    },
    adhigaram: {
      q: {
        ta: "அதிகாரம் என்றால் என்ன?",
        en: "What is an Adhigaram (Chapter)?"
      },
      a: {
        ta: "திருக்குறளில் மொத்தம் 133 அதிகாரங்கள் உள்ளன. ஒவ்வொரு அதிகாரமும் ஒரு குறிப்பிட்ட கருப்பொருளை விளக்கும் 10 குறள்களைக் கொண்டிருக்கும்.",
        en: "Thirukkural is composed of 133 Chapters (Adhigarams). Each chapter contains exactly 10 couplets focusing on a specific virtue or theme."
      }
    },
    paal: {
      q: {
        ta: "பால் என்றால் என்ன?",
        en: "What is a Paal (Section)?"
      },
      a: {
        ta: "திருக்குறள் 3 பெரும் பிரிவுகளாகப் (பால்கள்) பிரிக்கப்பட்டுள்ளது: அறத்துப்பால் (அறம்), பொருட்பால் (பொருள்), மற்றும் இன்பத்துப்பால் (காதல்/இன்பம்).",
        en: "Thirukkural is divided into 3 Books (Paals): Aram (Virtue & Ethics), Porul (Wealth, Politics & Administration), and Inbam (Love & Pleasure)."
      }
    },
    author: {
      q: {
        ta: "திருவள்ளுவர் யார்?",
        en: "Who was Thiruvalluvar?"
      },
      a: {
        ta: "திருவள்ளுவர் திருக்குறளை இயற்றிய முனிவர் மற்றும் கவிஞர் ஆவார். இவரது கருத்துக்கள் மதங்களைக் கடந்து உலகப் பொதுமறையாக விளங்குகின்றன. классиக்கல் தமிழ் இலக்கியத்தின் மிகச் சிறந்த அடையாளமாகத் திகழ்கிறார்.",
        en: "Sage Thiruvalluvar was a celebrated Tamil poet and philosopher who wrote the Thirukkural. Estimated to have lived around 31 BC, his teachings represent universal ethics that transcend any religion."
      }
    }
  };

  const handleLangSelect = (lang) => {
    setChatLang(lang);
    setStep('mode');
  };

  const handleFaqSelect = (key) => {
    setSelectedFaq(key);
    setStep('site-answer');
  };

  const handleKuralSubmit = async (e) => {
    e.preventDefault();
    setKuralError(null);
    setApiError(null);

    const num = parseInt(kuralNumber, 10);
    if (isNaN(num) || num < 1 || num > 1330) {
      setKuralError(chatLang === 'ta' ? 'தயவுசெய்து 1 முதல் 1330 வரை ஒரு எண்ணை உள்ளிடவும்.' : 'Please enter a number between 1 and 1330.');
      return;
    }

    setLoading(true);
    setStep('kural-result');

    // 1. Check local storage cache first
    const cacheKey = `thirukkural_explain_${num}_${chatLang}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setExplanation(JSON.parse(cached));
      setLoading(false);
      return;
    }

    try {
      // 2. Fetch Kural metadata
      const kuralRes = await fetch(`/api/kural/${num}`);
      if (!kuralRes.ok) {
        throw new Error(chatLang === 'ta' ? 'குறள் தரவைப் பெற முடியவில்லை.' : 'Failed to fetch Kural data.');
      }
      const kData = await kuralRes.json();
      setKuralData(kData);

      // 3. Request explanation from AI
      const explainRes = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          kuralId: kData.kuralId,
          lang: chatLang,
          tamil: kData.tamil,
          meaning: kData.meaning,
          themes: kData.themes,
          lifeApplications: kData.lifeApplications
        })
      });

      if (!explainRes.ok) {
        throw new Error(chatLang === 'ta' ? 'விளக்கம் பெறும்போது பிழை ஏற்பட்டது.' : 'Failed to retrieve AI explanation.');
      }

      const parsed = await explainRes.json();
      localStorage.setItem(cacheKey, JSON.stringify(parsed));
      setExplanation(parsed);

    } catch (err) {
      console.error(err);
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetKural = () => {
    setKuralNumber('');
    setExplanation(null);
    setKuralData(null);
    setApiError(null);
    setStep('kural-explain');
  };

  const transitionConfig = shouldReduceMotion 
    ? { duration: 0.01 }
    : { type: 'spring', stiffness: 350, damping: 28 };

  return (
    <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50 font-sans-tamil select-none">
      
      {/* Floating Action Button */}
      <motion.button
        id="ai-fab-button"
        onPointerDown={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.90 }}
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-terracotta text-white flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer border-2 border-paper-bg focus:outline-none overflow-hidden relative"
        aria-label="Open AI assistant"
      >
        <img 
          src="/ai_popup.png" 
          alt="Sage Icon" 
          className="w-full h-full object-cover p-1 scale-105"
        />
        <div className="absolute inset-0 bg-terracotta/10 hover:bg-transparent transition-colors duration-200"></div>
      </motion.button>

      {/* Floating Popup Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={transitionConfig}
            className="absolute bottom-18 right-0 md:bottom-20 w-80 sm:w-96 max-w-[90vw] bg-paper-card/95 dark:bg-ink-card/95 backdrop-blur-md border border-terracotta/40 rounded-2xl shadow-2xl flex flex-col max-h-[500px] overflow-hidden text-ink-bg dark:text-paper-bg"
          >
            
            {/* Header */}
            <div className="p-4 border-b border-paper-border dark:border-ink-border flex justify-between items-center bg-terracotta/5">
              <div className="flex items-center space-x-2">
                <span className="text-xl">📜</span>
                <span className="font-serif-tamil font-bold text-sm sm:text-base tracking-wide text-ink-bg dark:text-paper-bg">
                  {chatLang === 'ta' ? 'வள்ளுவர் குரல்' : 'Valluvar Voice'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                {chatLang && step !== 'lang' && (
                  <button 
                    onClick={() => {
                      setStep('lang');
                      setChatLang(null);
                    }} 
                    className="text-xs text-ochre hover:underline cursor-pointer font-bold focus:outline-none"
                  >
                    {chatLang === 'ta' ? 'மொழி / Language' : 'Change Lang'}
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-ink-bg/50 dark:text-paper-bg/50 hover:text-terracotta p-1 text-sm font-bold focus:outline-none"
                  aria-label="Close assistant"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content Area with Scroll */}
            <div className="flex-grow overflow-y-auto p-5 text-sm leading-relaxed">
              
              {/* STEP 1: Language Selection */}
              {step === 'lang' && (
                <div className="space-y-5 text-center py-4">
                  <h4 className="font-bold text-base">
                    பதிலுக்கான மொழியைத் தேர்ந்தெடுக்கவும் <br />
                    <span className="text-xs text-ink-bg/60 dark:text-paper-bg/60 font-normal">Choose language for explanation response</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleLangSelect('ta')}
                      className="p-4 rounded-xl border border-paper-border dark:border-ink-border bg-paper-bg dark:bg-ink-bg hover:border-terracotta hover:text-terracotta font-bold text-base transition-all duration-200 cursor-pointer focus:outline-none active:scale-95 shadow-sm"
                    >
                      தமிழ்
                    </button>
                    <button
                      onClick={() => handleLangSelect('en')}
                      className="p-4 rounded-xl border border-paper-border dark:border-ink-border bg-paper-bg dark:bg-ink-bg hover:border-terracotta hover:text-terracotta font-bold text-base transition-all duration-200 cursor-pointer focus:outline-none active:scale-95 shadow-sm"
                    >
                      English
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Mode Selection */}
              {step === 'mode' && (
                <div className="space-y-4 py-2">
                  <p className="font-medium text-center text-ink-bg/80 dark:text-paper-bg/80 mb-4">
                    {chatLang === 'ta' 
                      ? 'வணக்கம்! நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?' 
                      : 'Welcome! How can I help you today?'}
                  </p>
                  <button
                    onClick={() => setStep('site-guide')}
                    className="w-full p-4 rounded-xl border border-paper-border dark:border-ink-border bg-paper-bg dark:bg-ink-bg hover:border-terracotta text-left font-bold transition-all duration-200 cursor-pointer focus:outline-none active:scale-98 shadow-sm flex items-center space-x-3 group"
                  >
                    <span className="text-xl">🗺️</span>
                    <div className="flex flex-col">
                      <span>{chatLang === 'ta' ? 'இணைய வழிகாட்டி' : 'Site Guide'}</span>
                      <span className="text-[11px] font-normal text-ink-bg/60 dark:text-paper-bg/60 mt-0.5">
                        {chatLang === 'ta' ? 'தேடல் மற்றும் விருப்பங்கள் பற்றிய உதவிகள்' : 'Help with search, saving Kurals, chapters, etc.'}
                      </span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setStep('kural-explain')}
                    className="w-full p-4 rounded-xl border border-paper-border dark:border-ink-border bg-paper-bg dark:bg-ink-bg hover:border-terracotta text-left font-bold transition-all duration-200 cursor-pointer focus:outline-none active:scale-98 shadow-sm flex items-center space-x-3 group"
                  >
                    <span className="text-xl">✨</span>
                    <div className="flex flex-col">
                      <span>{chatLang === 'ta' ? 'குறள் விளக்கம்' : 'Explain a Kural'}</span>
                      <span className="text-[11px] font-normal text-ink-bg/60 dark:text-paper-bg/60 mt-0.5">
                        {chatLang === 'ta' ? 'குறள் எண் கொண்டு AI விளக்கங்கள் பெற' : 'Enter Kural number for custom narrative explanation'}
                      </span>
                    </div>
                  </button>
                </div>
              )}

              {/* STEP 3: Site Guide (FAQ list) */}
              {step === 'site-guide' && (
                <div className="space-y-4">
                  <h4 className="font-bold text-ochre uppercase tracking-wider text-xs">
                    {chatLang === 'ta' ? 'அடிக்கடி கேட்கப்படும் கேள்விகள் (FAQs)' : 'Static Site Help'}
                  </h4>
                  <div className="space-y-2">
                    {Object.keys(faqs).map((key) => (
                      <button
                        key={key}
                        onClick={() => handleFaqSelect(key)}
                        className="w-full p-3 rounded-lg border border-paper-border/60 dark:border-ink-border/60 hover:border-terracotta text-left bg-paper-bg/40 dark:bg-ink-bg/40 transition-colors duration-150 cursor-pointer flex justify-between items-center focus:outline-none"
                      >
                        <span className="font-medium text-xs sm:text-sm">{faqs[key].q[chatLang]}</span>
                        <span className="text-xs text-ochre">➔</span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setStep('mode')}
                    className="w-full mt-4 py-2 bg-paper-border dark:bg-ink-border text-xs font-bold rounded-lg hover:bg-paper-border/80 transition-colors cursor-pointer text-center focus:outline-none"
                  >
                    {chatLang === 'ta' ? '◀ முகப்புத் திரை' : '◀ Back to Main'}
                  </button>
                </div>
              )}

              {/* STEP 4: Site Guide Answer */}
              {step === 'site-answer' && selectedFaq && (
                <div className="space-y-4 py-1">
                  <h5 className="font-bold text-ochre text-xs uppercase tracking-wide">
                    {chatLang === 'ta' ? 'கேள்வி / FAQ Topic' : 'FAQ Topic'}
                  </h5>
                  <p className="font-bold text-sm sm:text-base border-b border-paper-border/50 dark:border-ink-border/50 pb-2">
                    {faqs[selectedFaq].q[chatLang]}
                  </p>
                  <p className="text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed text-sm">
                    {faqs[selectedFaq].a[chatLang]}
                  </p>
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => setStep('site-guide')}
                      className="flex-1 py-2 bg-paper-border dark:bg-ink-border text-xs font-bold rounded-lg hover:bg-paper-border/80 transition-colors cursor-pointer text-center focus:outline-none"
                    >
                      {chatLang === 'ta' ? '◀ கேள்விகள்' : '◀ Back to FAQ'}
                    </button>
                    <button
                      onClick={() => setStep('mode')}
                      className="flex-1 py-2 bg-terracotta/10 text-terracotta text-xs font-bold rounded-lg hover:bg-terracotta/20 transition-colors cursor-pointer text-center focus:outline-none"
                    >
                      {chatLang === 'ta' ? 'முகப்பு' : 'Main Menu'}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Kural Explain input */}
              {step === 'kural-explain' && (
                <form onSubmit={handleKuralSubmit} className="space-y-4">
                  <h4 className="font-bold text-ochre uppercase tracking-wider text-xs">
                    {chatLang === 'ta' ? 'AI விளக்கம் - குறள் எண்' : 'AI Explanation Helper'}
                  </h4>
                  <div className="space-y-2">
                    <label htmlFor="kural-num-input" className="block text-xs text-ink-bg/70 dark:text-paper-bg/70">
                      {chatLang === 'ta' ? 'விளக்கம் வேண்டிய குறள் எண் (1 - 1330):' : 'Enter Kural Number (1 - 1330):'}
                    </label>
                    <input
                      id="kural-num-input"
                      type="number"
                      min="1"
                      max="1330"
                      value={kuralNumber}
                      onChange={(e) => setKuralNumber(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full px-4 py-2.5 rounded-xl border border-paper-border dark:border-ink-border bg-paper-bg dark:bg-ink-bg text-ink-bg dark:text-paper-bg focus:ring-2 focus:ring-terracotta focus:border-terracotta outline-none text-base font-mono"
                      required
                    />
                    {kuralError && (
                      <p className="text-red-500 text-xs mt-1 font-bold">{kuralError}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('mode')}
                      className="flex-1 py-2.5 bg-paper-border dark:bg-ink-border text-xs font-bold rounded-lg hover:bg-paper-border/80 transition-colors cursor-pointer text-center focus:outline-none"
                    >
                      {chatLang === 'ta' ? '◀ முகப்பு' : '◀ Back'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-terracotta text-white text-xs font-bold rounded-lg hover:bg-terracotta/90 transition-colors cursor-pointer text-center focus:outline-none"
                    >
                      {chatLang === 'ta' ? 'விளக்குக' : 'Explain'}
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 6: Kural Explain Result */}
              {step === 'kural-result' && (
                <div className="space-y-4">
                  {loading && (
                    <div className="space-y-4 py-8 text-center" aria-busy="true" aria-label="Loading AI explanation">
                      <div className="inline-block w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-ink-bg/60 dark:text-paper-bg/60 animate-pulse font-medium">
                        {chatLang === 'ta' 
                          ? 'வள்ளுவரின் வரிகளை ஆராய்கிறது...' 
                          : 'Deeply analyzing the couplet details...'}
                      </p>
                    </div>
                  )}

                  {apiError && !loading && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs space-y-2">
                      <p className="font-bold flex items-center space-x-1">
                        <span>⚠️</span>
                        <span>{chatLang === 'ta' ? 'பிழை ஏற்பட்டது.' : 'Failed to explain.'}</span>
                      </p>
                      <p className="font-mono">{apiError}</p>
                      <button
                        onClick={handleKuralSubmit}
                        className="underline text-xs font-bold cursor-pointer hover:opacity-80 block pt-1"
                      >
                        {chatLang === 'ta' ? 'மீண்டும் முயலவும்' : 'Retry'}
                      </button>
                    </div>
                  )}

                  {explanation && !loading && !apiError && (
                    <div className="space-y-5 py-1">
                      <div className="border-b border-paper-border/60 dark:border-ink-border/60 pb-3 text-center">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-terracotta/10 text-terracotta rounded font-mono">
                          {chatLang === 'ta' ? `குறள் ${kuralNumber}` : `Kural ${kuralNumber}`}
                        </span>
                        {kuralData && (
                          <div className="font-serif-tamil text-xs font-bold text-ink-bg dark:text-paper-bg mt-2 italic">
                            <p>{kuralData.tamil.line1}</p>
                            <p>{kuralData.tamil.line2}</p>
                          </div>
                        )}
                      </div>

                      {explanation.narrative ? (
                        <div className="text-xs text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed space-y-3 font-sans-tamil">
                          {explanation.narrative.split('\n').map((para, idx) => {
                            if (!para.trim()) return null;
                            return <p key={idx}>{para}</p>;
                          })}
                        </div>
                      ) : (
                        <>
                          {/* Hook */}
                          {explanation.hook && (
                            <p className="text-sm font-medium italic text-terracotta leading-relaxed border-l-4 border-terracotta/40 pl-3 py-0.5">
                              "{explanation.hook}"
                            </p>
                          )}

                          {/* Situation */}
                          {explanation.situation && (
                            <div className="space-y-1">
                              <h5 className="text-[10px] tracking-wider uppercase font-bold text-ochre">
                                {chatLang === 'ta' ? '🎭 வாழ்வியல் சூழல்' : '🎭 Fictional Frame'}
                              </h5>
                              <p className="text-xs text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed">
                                {explanation.situation}
                              </p>
                            </div>
                          )}

                          {/* Wisdom */}
                          {explanation.deeperMeaning && (
                            <div className="space-y-1">
                              <h5 className="text-[10px] tracking-wider uppercase font-bold text-ochre">
                                {chatLang === 'ta' ? '🧠 ஆழமான பொருள்' : '🧠 Deeper Wisdom'}
                              </h5>
                              <p className="text-xs text-ink-bg/90 dark:text-paper-bg/90 leading-relaxed">
                                {explanation.deeperMeaning}
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Takeaway */}
                      {explanation.takeaway && (
                        <div className="pt-2 border-t border-paper-border/40 dark:border-ink-border/40">
                          <div className="p-3 bg-terracotta/5 border border-terracotta/20 rounded-xl text-center shadow-inner">
                            <span className="block text-[9px] tracking-wider uppercase font-bold text-terracotta mb-1">
                              {chatLang === 'ta' ? '💭 முக்கியக் கருத்து' : '💭 Takeaway'}
                            </span>
                            <p className="font-serif-tamil text-xs sm:text-sm font-bold text-ink-bg dark:text-paper-bg leading-relaxed">
                              {explanation.takeaway}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!loading && (
                    <button
                      onClick={handleResetKural}
                      className="w-full mt-4 py-2 bg-paper-border dark:bg-ink-border text-xs font-bold rounded-lg hover:bg-paper-border/80 transition-colors cursor-pointer text-center focus:outline-none"
                    >
                      {chatLang === 'ta' ? '◀ மற்றொரு எண்ணை விளக்குக' : '◀ Explain Another Kural'}
                    </button>
                  )}
                </div>
              )}

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

export function AIPopup() {
  return (
    <ErrorBoundary>
      <AIPopupContent />
    </ErrorBoundary>
  );
}
