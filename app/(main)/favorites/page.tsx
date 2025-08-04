'use client';

import { useEffect, useState } from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Cookies from 'js-cookie';
import ProductCard from '@/app/components/ProductCard';
import { useLanguageContext } from '@/app/contexts/LanguageContext';

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  slug: string;
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguageContext();

  useEffect(() => {
    const loadFavorites = async () => {
      const favoritesIds = Cookies.get('favorites');
      if (!favoritesIds) {
        setIsLoading(false);
        return;
      }

      try {
        const ids = JSON.parse(favoritesIds) as string[];
        if (ids.length === 0) {
          setIsLoading(false);
          return;
        }

        // Загружаем информацию о товарах
        const response = await fetch('/api/products/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ids }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }

        const data = await response.json();
        setFavorites(data.products);
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
      setIsLoading(false);
    };

    loadFavorites();

    // Подписываемся на обновления избранного
    const handleFavoritesUpdate = (event: CustomEvent) => {
      loadFavorites();
    };

    window.addEventListener('favoritesUpdate', handleFavoritesUpdate as EventListener);

    return () => {
      window.removeEventListener('favoritesUpdate', handleFavoritesUpdate as EventListener);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Баннер */}
        <div className="relative bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('favorites')}</h1>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">{t('noFavorites')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('noFavoritesDesc')}</p>
            <div className="mt-6">
              <Link
                href="/catalog"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {t('goToCatalog')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Баннер */}
      <div className="relative bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('favorites')}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {favorites.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              images={product.images}
              slug={product.slug}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 