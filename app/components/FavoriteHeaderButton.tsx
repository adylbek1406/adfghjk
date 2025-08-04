'use client';

import { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { useLanguageContext } from '@/app/contexts/LanguageContext';

interface FavoriteHeaderButtonProps {
  showText?: boolean;
}

export default function FavoriteHeaderButton({ showText = false }: FavoriteHeaderButtonProps) {
  const [itemsCount, setItemsCount] = useState(0);
  const { t } = useLanguageContext();

  useEffect(() => {
    const updateFavoritesCount = () => {
      const favorites = Cookies.get('favorites');
      if (favorites) {
        try {
          const favoritesList = JSON.parse(favorites) as string[];
          setItemsCount(favoritesList.length);
        } catch (error) {
          console.error('Error parsing favorites:', error);
          setItemsCount(0);
          Cookies.remove('favorites');
        }
      } else {
        setItemsCount(0);
      }
    };

    updateFavoritesCount();
    
    // Обновляем счетчик при изменении избранного
    const handleFavoritesUpdate = (event: CustomEvent) => {
      updateFavoritesCount();
    };

    window.addEventListener('favoritesUpdate', handleFavoritesUpdate as EventListener);
    
    return () => {
      window.removeEventListener('favoritesUpdate', handleFavoritesUpdate as EventListener);
    };
  }, []);

  return (
    <Link href="/favorites" className="relative flex items-center space-x-1 transition-colors hover:text-[#f85125]">
      <div className="relative">
        <HeartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
        {itemsCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-[#f85125] text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
            {itemsCount}
          </span>
        )}
      </div>
      {showText && <span className="text-sm font-medium">{t('favorites')}</span>}
    </Link>
  );
} 