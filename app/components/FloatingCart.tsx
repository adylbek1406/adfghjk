'use client';

import { useEffect, useState } from 'react';
import { ShoppingCartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { usePathname } from 'next/navigation';
import { useLanguageContext } from '@/app/contexts/LanguageContext';

interface CartData {
  [key: string]: number;
}

interface CartInfo {
  count: number;
  sum: number;
}

// Создаем кастомное событие для обновления корзины
const CART_UPDATE_EVENT = 'cartUpdate';

export default function FloatingCart() {
  const [cartInfo, setCartInfo] = useState<CartInfo>({ count: 0, sum: 0 });
  const pathname = usePathname();
  const isCartPage = pathname === '/cart';
  const { t } = useLanguageContext();

  const calculateCartInfo = (cartData: CartData, prices: Record<string, number>) => {
    const count = Object.values(cartData).reduce((acc, quantity) => acc + quantity, 0);
    const sum = Object.entries(cartData).reduce((acc, [id, quantity]) => {
      return acc + (prices[id] || 0) * quantity;
    }, 0);
    return { count, sum };
  };

  useEffect(() => {
    // Обновляем информацию при монтировании компонента
    const cart = Cookies.get('cart');
    if (cart) {
      try {
        const cartData = JSON.parse(cart) as CartData;
        const prices = JSON.parse(localStorage.getItem('cartPrices') || '{}');
        setCartInfo(calculateCartInfo(cartData, prices));
      } catch (error) {
        console.error('Error calculating cart info:', error);
      }
    }

    // Подписываемся на событие обновления корзины
    const handleCartUpdate = (event: CustomEvent) => {
      const { cartData, productId, price } = event.detail;
      
      // Обновляем цены в localStorage
      const prices = JSON.parse(localStorage.getItem('cartPrices') || '{}');
      if (price !== undefined) {
        prices[productId] = price;
        localStorage.setItem('cartPrices', JSON.stringify(prices));
      }
      
      setCartInfo(calculateCartInfo(cartData, prices));
    };

    window.addEventListener(CART_UPDATE_EVENT, handleCartUpdate as EventListener);

    return () => {
      window.removeEventListener(CART_UPDATE_EVENT, handleCartUpdate as EventListener);
    };
  }, []);

  if (cartInfo.count === 0 && !isCartPage) {
    return null;
  }

  if (isCartPage) {
    return (
      <Link 
        href="/catalog"
        className="fixed bottom-8 right-8 z-50 flex items-center space-x-4 bg-white rounded-2xl shadow-lg px-6 py-4 hover:shadow-xl transition-all duration-300 hover:scale-105 gradient-primary text-white"
      >
        <div className="flex items-center space-x-3">
          <ShoppingBagIcon className="h-6 w-6" />
          <span className="font-medium">{t('catalog')}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href="/cart"
      className="fixed bottom-8 right-8 z-50 flex items-center space-x-4 bg-white rounded-2xl shadow-lg px-6 py-4 hover:shadow-xl transition-all duration-300 hover:scale-105 gradient-primary text-white"
    >
      <div className="flex items-center space-x-3">
        <div className="relative">
          <ShoppingCartIcon className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 bg-white text-primary text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {cartInfo.count}
          </span>
        </div>
        <span className="font-medium">{t('cart')}</span>
      </div>
      <div className="pl-3 border-l border-white/20 font-medium">
        {cartInfo.sum.toLocaleString('ru-RU')} {t('currency')}
      </div>
    </Link>
  );
} 