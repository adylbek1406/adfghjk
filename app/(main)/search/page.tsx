'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/app/components/ProductCard';
import { useLanguageContext } from '@/app/contexts/LanguageContext';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  slug: string;
}

export default function SearchPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { t } = useLanguageContext();

  useEffect(() => {
    const searchProducts = async () => {
      setIsLoading(true);
      if (!query.trim()) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
        const data = await response.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Ошибка при поиске товаров:', error);
        setProducts([]);
      }
      setIsLoading(false);
    };

    searchProducts();
  }, [query]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Баннер */}
      <div className="relative bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            {query ? t('searchResults') : t('search')}
          </h1>
          {query && (
            <p className="mt-2 text-gray-600">
              {products.length > 0
                ? t('foundProducts', { count: products.length })
                : t('noProductsFound')}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!query ? (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">{t('startSearching')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('searchDescription')}</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {products.map((product) => (
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
        ) : (
          <div className="text-center py-12">
            <MagnifyingGlassIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">{t('noResults')}</h2>
            <p className="mt-2 text-sm text-gray-500">{t('tryAnotherSearch')}</p>
          </div>
        )}
      </div>
    </div>
  );
} 