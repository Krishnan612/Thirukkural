import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from './ErrorBoundary.jsx';

function FavoriteButtonContent({ kuralId }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('thirukkural_favorites') || '[]');
    setIsFavorite(favorites.includes(Number(kuralId)));

    const handleFavChange = () => {
      const currentFavs = JSON.parse(localStorage.getItem('thirukkural_favorites') || '[]');
      setIsFavorite(currentFavs.includes(Number(kuralId)));
    };

    window.addEventListener('favorites-change', handleFavChange);
    return () => {
      window.removeEventListener('favorites-change', handleFavChange);
    };
  }, [kuralId]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    const favorites = JSON.parse(localStorage.getItem('thirukkural_favorites') || '[]');
    const id = Number(kuralId);
    let nextFavorites;
    if (favorites.includes(id)) {
      nextFavorites = favorites.filter(f => f !== id);
      setIsFavorite(false);
    } else {
      nextFavorites = [...favorites, id];
      setIsFavorite(true);
    }
    localStorage.setItem('thirukkural_favorites', JSON.stringify(nextFavorites));
    
    // Dispatch event to update other components (like FavoritesList)
    window.dispatchEvent(new CustomEvent('favorites-change'));
  };

  return (
    <motion.button
      onPointerDown={toggleFavorite}
      whileTap={{ scale: 0.8 }}
      whileHover={{ scale: 1.08 }}
      transition={{ type: 'spring', stiffness: 500, damping: 12 }}
      className={`p-2.5 rounded-full border transition-colors duration-200 cursor-pointer flex items-center justify-center focus:outline-none ${
        isFavorite 
          ? 'bg-terracotta/10 border-terracotta text-terracotta shadow-sm' 
          : 'bg-paper-card dark:bg-ink-card border-paper-border dark:border-ink-border text-ink-bg/40 dark:text-paper-bg/40 hover:text-terracotta hover:border-terracotta shadow-sm'
      }`}
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isFavorite ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2.5"
        className="w-5 h-5"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
      </svg>
    </motion.button>
  );
}

export function FavoriteButton({ kuralId }) {
  return (
    <ErrorBoundary>
      <FavoriteButtonContent kuralId={kuralId} />
    </ErrorBoundary>
  );
}
