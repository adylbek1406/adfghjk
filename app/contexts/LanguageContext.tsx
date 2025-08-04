'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useLanguage } from '../hooks/useLanguage';

type LanguageContextType = ReturnType<typeof useLanguage>;

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ 
  children,
  initialLanguage = 'ru'
}: { 
  children: ReactNode;
  initialLanguage?: 'ru' | 'ky';
}) => {
  const languageUtils = useLanguage(initialLanguage);

  return (
    <LanguageContext.Provider value={languageUtils}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}; 