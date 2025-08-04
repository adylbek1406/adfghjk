'use client';

import { useState, useEffect } from 'react';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/20/solid';
import Cookies from 'js-cookie';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
}

export default function FavoriteButton({ productId, className = '' }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const favorites = Cookies.get('favorites');
    if (favorites) {
      const favoritesList = JSON.parse(favorites) as string[];
      setIsFavorite(favoritesList.includes(productId));
    }
  }, [productId]);

  const toggleFavorite = () => {
    const favorites = Cookies.get('favorites');
    let favoritesList: string[] = [];
    
    if (favorites) {
      favoritesList = JSON.parse(favorites);
    }

    if (isFavorite) {
      favoritesList = favoritesList.filter(id => id !== productId);
    } else {
      favoritesList.push(productId);
    }

    Cookies.set('favorites', JSON.stringify(favoritesList), { expires: 30 }); // Сохраняем на 30 дней
    setIsFavorite(!isFavorite);

    // Отправляем событие обновления избранного
    window.dispatchEvent(new CustomEvent('favoritesUpdate', {
      detail: {
        favorites: favoritesList
      }
    }));
  };

  return (
    <button
      onClick={(e) => {
        e.preventDefault(); // Предотвращаем переход по ссылке, если кнопка внутри ссылки
        toggleFavorite();
      }}
      className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${className}`}
    >
      {isFavorite ? (
        <HeartSolidIcon className="h-6 w-6 text-red-500" />
      ) : (
        <HeartOutlineIcon className="h-6 w-6 text-gray-500" />
      )}
    </button>
  );
} 