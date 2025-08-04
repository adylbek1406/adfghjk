'use client';

import { useEffect, useState } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Cookies from 'js-cookie';

interface CartData {
  [key: string]: number;
}

export default function CartButton() {
  const [itemsCount, setItemsCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = Cookies.get('cart');
      if (cart) {
        const cartItems = JSON.parse(cart) as CartData;
        const count = Object.values(cartItems).reduce((acc, quantity) => acc + quantity, 0);
        setItemsCount(count);
      }
    };

    updateCartCount();
    
    // Обновляем счетчик при изменении корзины
    const interval = setInterval(updateCartCount, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/cart" className="relative">
      <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <ShoppingCartIcon className="h-6 w-6" />
        {itemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {itemsCount}
          </span>
        )}
      </button>
    </Link>
  );
} 