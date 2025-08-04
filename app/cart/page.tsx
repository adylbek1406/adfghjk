'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon, MinusIcon, PlusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import OrderForm from '../components/OrderForm';
import { useLanguageContext } from '@/app/contexts/LanguageContext';

// Определяем только необходимые поля для Product
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: { url: string }[];
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const { t } = useLanguageContext();

  useEffect(() => {
    const loadCart = async () => {
      const cart = Cookies.get('cart');
      if (!cart) {
        setIsLoading(false);
        return;
      }

      try {
        const cartData = JSON.parse(cart) as Record<string, number>;
        const productIds = Object.keys(cartData);
        const prices = JSON.parse(localStorage.getItem('cartPrices') || '{}');
        const productDetails = JSON.parse(localStorage.getItem('productDetails') || '{}');

        if (productIds.length === 0) {
          setIsLoading(false);
          return;
        }

        // Создаем объекты товаров из сохраненных данных
        const items = productIds.map(id => ({
          product: {
            id,
            name: productDetails[id]?.name || t('productNotFound'),
            description: productDetails[id]?.description || '',
            price: prices[id] || 0,
            images: productDetails[id]?.images || []
          },
          quantity: cartData[id]
        }));

        setCartItems(items);
      } catch (error) {
        console.error('Error loading cart:', error);
      }
      setIsLoading(false);
    };

    loadCart();
  }, [t]);

  const updateQuantity = (productId: string, delta: number) => {
    const cart = Cookies.get('cart');
    if (cart) {
      const cartData = JSON.parse(cart) as Record<string, number>;
      const newQuantity = (cartData[productId] || 0) + delta;
      const prices = JSON.parse(localStorage.getItem('cartPrices') || '{}');

      if (newQuantity <= 0) {
        delete cartData[productId];
        setCartItems(prev => prev.filter(item => item.product.id !== productId));
      } else {
        cartData[productId] = newQuantity;
        setCartItems(prev => prev.map(item => 
          item.product.id === productId 
            ? { ...item, quantity: newQuantity }
            : item
        ));
      }

      if (Object.keys(cartData).length === 0) {
        Cookies.remove('cart');
      } else {
        Cookies.set('cart', JSON.stringify(cartData), { expires: 7 });
      }

      // Вызываем событие обновления корзины
      window.dispatchEvent(new CustomEvent('cartUpdate', {
        detail: {
          cartData,
          productId,
          price: prices[productId]
        }
      }));
    }
  };

  const removeFromCart = (productId: string) => {
    const cart = Cookies.get('cart');
    if (cart) {
      const cartData = JSON.parse(cart) as Record<string, number>;
      const prices = JSON.parse(localStorage.getItem('cartPrices') || '{}');
      delete cartData[productId];

      if (Object.keys(cartData).length === 0) {
        Cookies.remove('cart');
      } else {
        Cookies.set('cart', JSON.stringify(cartData), { expires: 7 });
      }

      setCartItems(prev => prev.filter(item => item.product.id !== productId));

      // Вызываем событие обновления корзины
      window.dispatchEvent(new CustomEvent('cartUpdate', {
        detail: {
          cartData,
          productId,
          price: prices[productId]
        }
      }));
    }
  };

  const totalSum = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mb-8">
              <ShoppingBagIcon className="mx-auto h-24 w-24 text-gray-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{t('cartEmpty')}</h1>
            <p className="text-gray-600 mb-8">{t('addItemsToCart')}</p>
            <Link
              href="/catalog"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
            >
              {t('goToCatalog')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 mb-24 sm:mb-0">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('cart')}</h1>
              <div className="text-xl sm:text-2xl font-bold text-primary">
                {totalSum.toLocaleString('ru-RU')} {t('currency')}
              </div>
            </div>
          </div>

          <ul className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <li key={item.product.id} className="p-4 sm:p-6 md:p-8 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <div className="relative w-full sm:w-24 md:w-32 aspect-square sm:aspect-auto sm:h-24 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100">
                    <Image
                      src={item.product.images[0]?.url || '/images/product-default.png'}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2 sm:gap-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {item.product.name}
                          </h3>
                          {item.product.description && (
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                              {item.product.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                          <div className="text-lg font-semibold text-gray-900">
                            {(item.product.price * item.quantity).toLocaleString('ru-RU')} {t('currency')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {item.product.price.toLocaleString('ru-RU')} {t('currency')} {t('perUnit')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={t('decreaseQuantity')}
                          >
                            <MinusIcon className="h-5 w-5" />
                          </button>
                          <span className="font-medium text-lg w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={t('increaseQuantity')}
                          >
                            <PlusIcon className="h-5 w-5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-2 rounded-full hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                          aria-label={t('removeFromCart')}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="p-4 sm:p-6 md:p-8 bg-gray-50 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-lg font-semibold text-gray-900">
                {t('total')}: {totalSum.toLocaleString('ru-RU')} {t('currency')}
              </div>
              <button
                onClick={() => setShowOrderForm(true)}
                className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                {t('checkout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showOrderForm && (
        <OrderForm 
          cartItems={cartItems} 
          totalSum={totalSum} 
          onClose={() => setShowOrderForm(false)} 
        />
      )}
    </div>
  );
} 