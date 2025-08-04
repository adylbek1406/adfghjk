'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  ShoppingCartIcon, 
  XMarkIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguageContext } from '../contexts/LanguageContext';
import { LanguageToggle } from './LanguageToggle';
import SearchBar from './SearchBar';
import FavoriteHeaderButton from './FavoriteHeaderButton';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { t } = useLanguageContext();

  // Поиск товаров
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.products || []);
      } catch (error) {
        console.error('Ошибка при поиске товаров:', error);
        setSearchResults([]);
      }
    };

    const debounceTimeout = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  // Закрываем меню при изменении размера экрана
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Обработчик для клавиши Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        setIsSearchFocused(false);
        document.body.style.overflow = '';
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : '';
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <>
      {/* Навигация */}
      <nav 
        className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-gray-100"
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (!target.closest('.search-container')) {
            setIsSearchFocused(false);
          }
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Логотип */}
            <Link href="/" className="flex-shrink-0" onClick={closeMobileMenu}>
              <Image
                src="/logo-small.svg"
                alt="АПАКАЙ"
                width={100}
                height={100}
                className="w-auto h-[15px] sm:h-[35px]"
              />
            </Link>

            {/* Правая часть (поиск и навигация) */}
            <div className="flex items-center gap-2 sm:gap-8 flex-1 justify-end">
              {/* Поисковая строка */}
              <div className="max-w-xl w-full hidden sm:block">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t('search')}
                  onSearch={handleSearch}
                />
              </div>

              {/* Навигация */}
              <div className="flex items-center space-x-1 sm:space-x-6">
                <div className="rounded-lg hover:bg-[#f85125]/10 transition-colors h-10 flex items-center">
                <LanguageToggle />
                </div>
                
                {/* Каталог - скрыть на мобильных */}
                <Link 
                  href="/catalog" 
                  className="hidden sm:flex items-center space-x-1 transition-colors hover:text-[#f85125] rounded-lg hover:bg-[#f85125]/10 h-10 px-1.5"
                >
                  <ShoppingBagIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="text-sm font-medium">{t('catalog')}</span>
                </Link>

                {/* Избранное - скрыть на мобильных */}
                <div className="hidden sm:flex items-center rounded-lg hover:bg-[#f85125]/10 transition-colors h-10 px-1.5">
                  <FavoriteHeaderButton showText={true} />
                </div>

                {/* Корзина - показывать всегда */}
                <Link 
                  href="/cart" 
                  className="flex items-center space-x-1 transition-colors hover:text-[#f85125] rounded-lg hover:bg-[#f85125]/10 h-10 px-1.5"
                >
                  <ShoppingCartIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span className="hidden sm:inline text-sm font-medium">{t('cart')}</span>
                </Link>

                {/* Кнопка мобильного меню */}
                <button 
                  onClick={toggleMobileMenu}
                  className="sm:hidden p-1 rounded-lg hover:bg-gray-100"
                  aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
                >
                  {isMobileMenuOpen ? (
                    <XMarkIcon className="h-5 w-5" />
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Мобильная поисковая строка */}
          <div className="sm:hidden py-2">
            <div className="flex items-center gap-2">
              <div className="relative search-container flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t('search')}
                  onSearch={handleSearch}
                />
              </div>
              <Link 
                href="/catalog"
                className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-300 hover:border-primary hover:text-primary transition-colors"
              >
                <ShoppingBagIcon className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Мобильное меню */}
      <div 
        className={`
          fixed inset-0 bg-black/50 z-50 transition-opacity duration-300
          ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={closeMobileMenu}
      >
        <div 
          className={`
            fixed right-0 top-0 h-full w-[280px] max-w-[85vw] bg-white transform transition-transform duration-300
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-lg font-bold text-gray-900">{t('menu')}</span>
                <button 
                  onClick={closeMobileMenu}
                  className="p-1 rounded-lg hover:bg-gray-100"
                  aria-label={t('closeMenu')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="mb-6">
                  <LanguageToggle />
                </div>
                <Link 
                  href="/catalog" 
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-lg hover:bg-gray-100"
                  onClick={closeMobileMenu}
                >
                  <ShoppingBagIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{t('catalog')}</span>
                </Link>
                <div className="px-3 py-2.5" onClick={closeMobileMenu}>
                  <FavoriteHeaderButton showText={true} />
                </div>
                <Link 
                  href="/cart" 
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-lg hover:bg-gray-100"
                  onClick={closeMobileMenu}
                >
                  <ShoppingCartIcon className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">{t('cart')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 