'use client';

import { useLanguageContext } from '../contexts/LanguageContext';
import { LanguageIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useRef, useEffect } from 'react';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguageContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLang: 'ru' | 'ky') => {
    if (language !== newLang) {
      toggleLanguage();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-1.5 rounded-lg transition-colors group"
        aria-expanded={isOpen}
      >
        <LanguageIcon className="h-5 w-5 text-gray-600 group-hover:text-[#f85125] transition-colors" />
        <span className="font-medium text-gray-700 group-hover:text-[#f85125] transition-colors">
          {language === 'ru' ? 'RU' : 'KG'}
        </span>
        <ChevronDownIcon className={`h-4 w-4 text-gray-600 group-hover:text-[#f85125] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-32 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={() => handleLanguageChange('ru')}
              className={`w-full flex items-center px-4 py-2 text-sm ${
                language === 'ru'
                  ? 'text-primary bg-gray-50 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Русский
            </button>
            <button
              onClick={() => handleLanguageChange('ky')}
              className={`w-full flex items-center px-4 py-2 text-sm ${
                language === 'ky'
                  ? 'text-primary bg-gray-50 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Кыргызча
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 