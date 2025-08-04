'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguageContext } from '@/app/contexts/LanguageContext';
import { ShoppingCartIcon, MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import FavoriteButton from '@/app/components/FavoriteButton';
import InstallmentCalculator from '@/app/components/InstallmentCalculator';
import Cookies from 'js-cookie';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: {
    url: string;
  }[];
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const { t } = useLanguageContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);

  // Загружаем состояние корзины при монтировании
  useEffect(() => {
    if (product) {
      const savedCart = Cookies.get('cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        setQuantity(cart[product.id] || 0);
      }
    }
  }, [product]);

  const updateCart = (delta: number) => {
    if (!product) return;

    const newQuantity = quantity + delta;
    
    if (newQuantity >= 0) {
      setQuantity(newQuantity);
      
      // Обновляем корзину в куках
      const savedCart = Cookies.get('cart');
      const cart = savedCart ? JSON.parse(savedCart) : {};
      
      if (newQuantity === 0) {
        delete cart[product.id];
      } else {
        cart[product.id] = newQuantity;
      }
      
      Cookies.set('cart', JSON.stringify(cart), { expires: 7 });

      // Сохраняем детали товара
      const productDetails = JSON.parse(localStorage.getItem('productDetails') || '{}');
      if (newQuantity > 0) {
        productDetails[product.id] = {
          name: product.name,
          images: product.images,
          price: product.price
        };
      } else {
        delete productDetails[product.id];
      }
      localStorage.setItem('productDetails', JSON.stringify(productDetails));

      // Отправляем событие обновления корзины
      window.dispatchEvent(new CustomEvent('cartUpdate', {
        detail: {
          cartData: cart,
          productId: product.id,
          price: product.price
        }
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('productNotFound')}</h1>
        <p className="text-gray-600">{t('productNotFoundDescription')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Галерея изображений */}
        <div className="flex gap-4">
          {/* Вертикальный список миниатюр */}
          <div className="flex flex-col gap-4 w-24">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square w-full overflow-hidden rounded-lg border-2 transition-all
                  ${index === selectedImageIndex 
                    ? 'border-primary' 
                    : 'border-transparent hover:border-gray-300'
                  }`}
              >
                <Image
                  src={image.url}
                  alt={`${product.name} - ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </button>
            ))}
          </div>

          {/* Большое изображение */}
          <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {product.images[selectedImageIndex] && (
              <Image
                src={product.images[selectedImageIndex].url}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 50vw, 100vw"
                priority
              />
            )}
          </div>
        </div>

        {/* Информация о товаре */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-medium text-gray-900 mb-2">{product.name}</h1>
          
          <div className="text-sm text-gray-600 mb-4">
            <p>{product.description}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-medium text-gray-900">
                {product.price.toLocaleString('ru-RU')} {t('currency')}
              </span>
            </div>

            <div className="flex items-center w-full max-w-md">
              {quantity > 0 ? (
                <div className="flex items-center w-full">
                  <div className="flex items-center justify-between p-2 h-10 rounded-lg gradient-primary text-white flex-grow mr-2">
                    <button
                      onClick={() => updateCart(-1)}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      aria-label={t('decreaseQuantity')}
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                    <span className="font-medium">{quantity}</span>
                    <button
                      onClick={() => updateCart(1)}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors"
                      aria-label={t('increaseQuantity')}
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => updateCart(-quantity)}
                      className="p-1 rounded-full hover:bg-white/10 transition-colors ml-2"
                      aria-label={t('removeFromCart')}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="w-10 flex-shrink-0">
                    <FavoriteButton productId={product.id} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center w-full">
                  <button 
                    onClick={() => updateCart(1)}
                    className="bg-primary text-white h-10 px-6 rounded-lg hover:bg-primary-dark transition-colors duration-200 flex-grow mr-2 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCartIcon className="h-4 w-4" />
                    <span className="text-sm">{t('addToCart')}</span>
                  </button>
                  <div className="w-10 flex-shrink-0">
                    <FavoriteButton productId={product.id} />
                  </div>
                </div>
              )}
            </div>

            {/* Калькулятор рассрочки */}
            <InstallmentCalculator price={product.price} />
          </div>
        </div>
      </div>
    </div>
  );
} 