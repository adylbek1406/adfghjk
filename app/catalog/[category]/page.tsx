'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ShoppingCartIcon, XMarkIcon, MinusIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import SearchBar from '@/app/components/SearchBar';
import Pagination from '@/app/components/Pagination';
import SortSelect from '@/app/components/SortSelect';
import Filters from '@/app/components/Filters';
import { useProducts } from '@/app/hooks/useProducts';
import { useLanguageContext } from '@/app/contexts/LanguageContext';
import Cookies from 'js-cookie';
import { TranslationKey } from '@/app/i18n/types';
import ProductCard from '@/app/components/ProductCard';
import Link from 'next/link';

const DEFAULT_PRODUCT_IMAGE = '/images/product-default.png';

// Компонент для просмотра галереи изображений товара
function ProductGallery({ images, name, price, t }: { images: any[], name: string, price: number, t: (key: TranslationKey) => string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };
  
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };
  
  return (
    <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-100">
      <img
        src={images[currentIndex]?.url || DEFAULT_PRODUCT_IMAGE}
        alt={name}
        className="object-cover object-center group-hover:scale-105 transition-transform duration-300 w-full h-full"
      />
      
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-primary transition-colors duration-300 shadow-lg border border-white/20 z-10"
            aria-label={t('previousImage')}
          >
            <ChevronLeftIcon className="h-5 w-5 drop-shadow-md" />
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-primary transition-colors duration-300 shadow-lg border border-white/20 z-10"
            aria-label={t('nextImage')}
          >
            <ChevronRightIcon className="h-5 w-5 drop-shadow-md" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-md ${
                  idx === currentIndex 
                    ? 'bg-primary scale-110' 
                    : 'bg-white/70 hover:bg-white'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                role="button"
                aria-label={`${t('image')} ${idx + 1} ${t('of')} ${images.length}`}
              />
            ))}
          </div>
        </>
      )}
      
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6">
        <div className="flex items-center justify-end">
          <div className="text-white font-bold text-xl drop-shadow-md">
            {price.toLocaleString('ru-RU')} {t('currency')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('name-asc');
  const [sortField, sortOrder] = sort.split('-') as [string, 'asc' | 'desc'];
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const { t } = useLanguageContext();
  const [categoryName, setCategoryName] = useState<string>('');

  const { data: productsData, isLoading: isProductsLoading, error: productsError } = useProducts(
    params.category,
    search,
    page,
    sortField,
    sortOrder,
    selectedFilters
  );

  // Загружаем название категории
  useEffect(() => {
    const fetchCategoryName = async () => {
      try {
        const response = await fetch(`/api/categories/${params.category}`);
        if (!response.ok) throw new Error('Failed to fetch category');
        const data = await response.json();
        setCategoryName(data.name);
      } catch (error) {
        console.error('Error loading category:', error);
      }
    };

    fetchCategoryName();
  }, [params.category]);

  const sortOptions = [
    { value: 'name-asc', label: t('sortNameAZ') },
    { value: 'name-desc', label: t('sortNameZA') },
    { value: 'price-asc', label: t('priceLowToHigh') },
    { value: 'price-desc', label: t('priceHighToLow') }
  ];

  const filterGroups = [
    {
      id: 'price_range',
      name: t('priceRange'),
      options: [
        { value: 'under_50000', label: t('priceUnder50') },
        { value: '50000_100000', label: t('price50to100') },
        { value: 'over_100000', label: t('priceOver100') }
      ]
    }
  ];

  const handleFilterChange = (groupId: string, values: string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [groupId]: values
    }));
    setPage(1);
  };

  if (productsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('errorOccurred')}</h2>
          <p className="text-gray-600">{t('tryAgainLater')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Баннер */}
      <div className="relative bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link href="/catalog" className="hover:text-primary">
              {t('catalog')}
            </Link>
            <span>/</span>
            <span>{categoryName || ''}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{categoryName || ''}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Сайдбар с фильтрами */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('filters')}</h2>
              <div className="space-y-6">
                <div>
                  <SearchBar
                    value={search}
                    onChange={(value) => {
                      setSearch(value);
                      setPage(1);
                    }}
                    placeholder={t('searchProducts')}
                  />
                </div>
                <div>
                  <SortSelect
                    value={sort}
                    onChange={(value) => {
                      setSort(value);
                      setPage(1);
                    }}
                    options={sortOptions}
                  />
                </div>
                <Filters
                  groups={filterGroups}
                  selectedFilters={selectedFilters}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>

          {/* Основной контент с товарами */}
          <div className="lg:col-span-3">
            {isProductsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {/* Отображение количества найденных товаров */}
                <div className="mb-6">
                  <p className="text-sm text-gray-600">
                    {t('foundProducts', { count: productsData?.total || 0 })}
                  </p>
                </div>

                {productsData?.products.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('noProductsFound')}</h3>
                    <p className="text-gray-600">{t('tryDifferentFilters')}</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {productsData?.products.map((product) => (
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

                    {productsData && productsData.totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={page}
                          totalPages={productsData.totalPages}
                          onPageChange={setPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 