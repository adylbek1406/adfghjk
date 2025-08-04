'use client';

import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Удаляем куки корзины
      Cookies.remove('cart');
      
      // Удаляем данные из localStorage
      localStorage.removeItem('cartPrices');
      localStorage.removeItem('productDetails');
      
      const response = await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include' // Важно для работы с httpOnly куками
      });

      if (response.ok) {
        // Удаляем auth_token куки на клиенте с правильными параметрами
        Cookies.remove('auth_token', {
          path: '/',
          domain: window.location.hostname,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
        
        // Дополнительно пытаемся удалить через document.cookie
        document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${window.location.hostname}; secure=${process.env.NODE_ENV === 'production'}; samesite=lax`;
        
        // Перенаправляем на главную страницу
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
      Выход
    </button>
  );
} 