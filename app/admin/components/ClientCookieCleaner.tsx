'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';

export default function ClientCookieCleaner() {
  useEffect(() => {
    // Удаляем куки корзины при любом переходе на /admin
    Cookies.remove('cart');
    localStorage.removeItem('cartPrices');
    localStorage.removeItem('productDetails');
  }, []);

  // Компонент не рендерит ничего видимого
  return null;
} 