'use client';

import { useEffect } from 'react';
import Cookies from 'js-cookie';
import AdminLayout from './AdminLayout';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Удаляем куки корзины при входе в админку
    Cookies.remove('cart');
    localStorage.removeItem('cartPrices');
    localStorage.removeItem('productDetails');
  }, []);

  return <AdminLayout>{children}</AdminLayout>;
} 