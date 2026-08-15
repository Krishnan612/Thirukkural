import React, { useState, useEffect } from 'react';

export function FavoritesList({ kurals }) {
  const [favorites, setFavorites] = useState([]);
  const [lang, setLang] = useState('ta');

  const loadFavorites = () => {
    const favoriteIds = JSON.parse(localStorage.getItem('thirukkural_favorites') || '[]');
    const filtered = kurals.filter(k => favoriteIds.includes(k.id));
    setFavorites(filtered);
  };

  useEffect(() => {
    loadFavorites();
    const currentLang = localStorage.getItem('lang') || 'ta';
    setLang(currentLang);

    const handleFavChange = () => loadFavorites();
    const handleLangChange = (e) => setLang(e.detail);

    window.addEventListener('favorites-change', handleFavChange);
    window.addEventListener('lang-change', handleLangChange);

    return () => {
      window.removeEventListener('favorites-change', handleFavChange);
      window.removeEventListener('lang-change', handleLangChange);
    };
  }, [kurals]);

  const removeFavorite = (id) => {
    const favoriteIds = JSON.parse(localStorage.getItem('thirukkural_favorites') || '[]');
    const nextFavorites = favoriteIds.filter(fid => fid !== id);
    localStorage.setItem('thirukkural_favorites', JSON.stringify(nextFavorites));
    window.dispatchEvent(new CustomEvent('favorites-change'));
  };

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16 bg-paper-card dark:bg-ink-card border border-paper-border dark:border-ink-border rounded-xl p-8 max-w-lg mx-auto">
        <span className="text-4xl select-none">💖</span>
        <h3 className="mt-4 text-xl font-bold font-sans-tamil">
          {lang === 'ta' ? 'விருப்பங்கள் ஏதுமில்லை' : 'No favorites yet'}
        </h3>
        <p className="mt-2 text-sm text-ink-bg/60 dark:text-paper-bg/60">
          {lang === 'ta' 
            ? 'அதிகாரங்களை வாசித்து, உங்களுக்குப் பிடித்த குறள்களைச் சேமித்து வையுங்கள்.' 
            : 'Explore chapters and save your favorite verses to build a personal collection.'}
        </p>
        <a
          href="/browse"
          className="mt-6 inline-block px-5 py-2.5 bg-terracotta text-white rounded-lg font-semibold hover:bg-terracotta/90 transition-colors duration-200"
        >
          {lang === 'ta' ? 'அதிகாரங்களை உலாவு' : 'Browse Chapters'}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {favorites.map(k => (
          <div 
            key={k.id}
            className="p-6 bg-paper-card dark:bg-ink-card border border-paper-border dark:border-ink-border rounded-xl shadow-sm hover:border-terracotta/50 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="inline-block px-2.5 py-0.5 text-xs font-bold bg-ochre/10 text-ochre rounded-full font-mono">
                  {lang === 'ta' ? `குறள் ${k.id}` : `Verse ${k.id}`}
                </span>
                <button
                  onClick={() => removeFavorite(k.id)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-500/10 transition-colors duration-200 cursor-pointer"
                  title={lang === 'ta' ? "நீக்கு" : "Remove"}
                  aria-label="Remove favorite"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.34 6m-4.74 0L9.03 9m12 3.682-1.5 8c-.085.456-.47.782-.937.782H5.402c-.466 0-.852-.326-.938-.782l-1.5-8m15 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-1.816c0-1.018-.728-1.84-1.724-1.84H8.718c-1 .001-1.72 0.842-1.72 1.84v1.816" />
                  </svg>
                </button>
              </div>
              <p className="font-serif-tamil text-lg font-bold leading-relaxed mb-4 text-ink-bg dark:text-paper-bg">
                {k.line1} <br />
                {k.line2}
              </p>
              <p className="text-sm text-ink-bg/75 dark:text-paper-bg/75 italic border-l-2 border-ochre/55 pl-3 leading-relaxed mb-4">
                {lang === 'ta' ? k.meaningTa : k.meaningEn}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-paper-border/60 dark:border-ink-border/60 flex items-center justify-between">
              <a
                href={`/kural/${k.id}`}
                className="text-sm font-semibold text-terracotta hover:underline inline-flex items-center space-x-1 cursor-pointer"
              >
                <span>{lang === 'ta' ? 'விளக்கம் வாசி →' : 'Read Explanation →'}</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
