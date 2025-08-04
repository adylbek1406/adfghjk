'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SearchBar from '@/app/components/SearchBar';
import Pagination from '@/app/components/Pagination';
import SortSelect from '@/app/components/SortSelect';
import { useCategories } from '@/app/hooks/useCategories';
import { useLanguageContext } from '@/app/contexts/LanguageContext';

const sortOptions = [
  { value: 'name-asc', label: 'По названию (А-Я)' },
  { value: 'name-desc', label: 'По названию (Я-А)' }
];

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('name-asc');
  const [sortField, sortOrder] = sort.split('-') as [string, 'asc' | 'desc'];
  const { t } = useLanguageContext();
  
  const { data, isLoading, error } = useCategories(search, page, sortField, sortOrder);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Баннер категорий */}
      <div className="relative bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('catalog')}</h1>
          <p className="mt-4 text-lg text-gray-600">
            {t('selectCategory')}
          </p>
        </div>
      </div>

      {/* Панель управления */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-8">
          <div className="w-full sm:w-96">
            <SearchBar
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder={t('searchPlaceholder')}
            />
          </div>
          <div className="w-full sm:w-64">
            <SortSelect
              value={sort}
              onChange={setSort}
              options={[
                { value: 'name-asc', label: t('sortNameAZ') },
                { value: 'name-desc', label: t('sortNameZA') }
              ]}
            />
          </div>
        </div>

        {error && (
          <div className="text-center py-12 text-red-600">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Сетка категорий */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {data?.categories?.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-lg text-gray-600">{t('noCategories')}</p>
                </div>
              ) : (
                data?.categories?.map((category) => (
                  <Link
                    key={category.id}
                    href={`/catalog/${category.id}`}
                    className="group relative overflow-hidden rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300"
                  >
                    <div className="absolute inset-0 gradient-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative p-8">
                      <div className="flex flex-col space-y-4">
                        <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-white transition-colors">
                          {category.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 group-hover:text-white/90 transition-colors">
                            {category.productsCount} {t('products')}
                          </span>
                          <span className="inline-flex items-center text-sm font-semibold text-gray-900 group-hover:text-white transition-colors">
                            {t('view')}
                            <svg className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Пагинация */}
            {data && data.totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={page}
                  totalPages={data.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 