'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  ShoppingCartIcon, 
  ChevronDownIcon, 
  XMarkIcon,
  PhoneIcon,
  ClockIcon,
  TruckIcon,
  ShieldCheckIcon,
  CubeIcon,
  HeartIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import FavoriteHeaderButton from './components/FavoriteHeaderButton';
import Link from 'next/link';
import Image from 'next/image';
import { CalendarDateRangeIcon } from '@heroicons/react/24/solid';
import { useLanguageContext } from './contexts/LanguageContext';
import { LanguageToggle } from './components/LanguageToggle';
import CategoriesBar from './components/CategoriesBar';
import ImageCarousel from './components/ImageCarousel';
import ProductCard from './components/ProductCard';
import { prisma } from '../lib/prisma';
import SearchBar from '@/app/components/SearchBar';

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  slug: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      take: 12,
      orderBy: {
        name: 'asc'
      },
      include: {
        images: true
      }
    });
    return products;
  } catch (error) {
    console.error('Ошибка при получении товаров:', error);
    return [];
  }
}

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [carouselImages, setCarouselImages] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const { t } = useLanguageContext();

  // Загрузка изображений для карусели
  useEffect(() => {
    const fetchCarouselImages = async () => {
      try {
        const response = await fetch('/api/settings/advertising_pictures');
        const data = await response.json();
        if (data.value) {
          setCarouselImages(JSON.parse(data.value));
        }
      } catch (error) {
        console.error('Ошибка при загрузке изображений для карусели:', error);
      }
    };

    fetchCarouselImages();
  }, []);

  // Загрузка товаров
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/featured');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Ошибка при загрузке товаров:', error);
      }
    };

    fetchProducts();
  }, []);

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

  const faqs: FAQItem[] = [
    {
      question: t('faqQuestion1'),
      answer: t('faqAnswer1')
    },
    {
      question: t('faqQuestion2'),
      answer: t('faqAnswer2')
    },
    {
      question: t('faqQuestion3'),
      answer: t('faqAnswer3')
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

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
    <div className="min-h-screen bg-gray-50">


      {searchQuery ? (
        /* Результаты поиска */
        <section className="py-8 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('searchResults')}
            </h2>
            {searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {searchResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    images={product.images}
                    slug={product.slug}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">{t('noResults')}</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Карусель изображений */}
          <ImageCarousel images={carouselImages} />

          {/* Популярные товары */}
          <section className="py-8 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {t('popularProducts')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    images={product.images}
                    slug={product.slug}
                  />
                ))}
              </div>
              <div className="mt-8 text-center">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 text-primary hover:text-primary-dark font-medium"
                >
                  {t('viewCatalog')}
                  <ChevronDownIcon className="w-4 h-4 rotate-[-90deg]" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Мобильное меню */}


      {/* О нас */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
            {t('aboutUs')}
            <div className="absolute w-24 h-1 bg-primary bottom-0 left-1/2 transform -translate-x-1/2 mt-4"></div>
          </h2>
          <div className="flex flex-col items-center max-w-4xl mx-auto">
            <div className="text-center mb-16 relative">
              <div className="absolute -left-6 -top-6 w-12 h-12 text-5xl text-primary opacity-20">"</div>
              <p className="text-gray-700 text-lg md:text-xl leading-relaxed px-4 md:px-8 lg:px-16 font-medium">
                {t('aboutUsText')}
                <br className="my-4" />
                {t('aboutUsDescription')}
              </p>
              <div className="absolute -right-6 -bottom-6 w-12 h-12 text-5xl text-primary opacity-20 rotate-180">"</div>
            </div>
            
            <div className="w-full">
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
                {t('ourAdvantages')}
                <div className="absolute w-24 h-1 gradient-primary bottom-0 left-1/2 transform -translate-x-1/2 mt-4"></div>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative group">
                  <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-8 text-white">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <TruckIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{t('fastDelivery')}</h3>
                        <p className="text-white/90">{t('fastDeliveryDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-8 text-white">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <ShieldCheckIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{t('qualityGuarantee')}</h3>
                        <p className="text-white/90">{t('qualityGuaranteeDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-8 text-white">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <CubeIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{t('wideRange')}</h3>
                        <p className="text-white/90">{t('wideRangeDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative p-8 text-white">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                        <HeartIcon className="h-8 w-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{t('affordablePrices')}</h3>
                        <p className="text-white/90">{t('affordablePricesDesc')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Как купить */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
            {t('howToBuy')}
            <div className="absolute w-24 h-1 gradient-primary bottom-0 left-1/2 transform -translate-x-1/2 mt-4"></div>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative group">
              <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 text-white">
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                    <ShoppingBagIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-2">01</div>
                    <h3 className="text-xl font-semibold mb-3">{t('step1')}</h3>
                    <p className="text-white/90">{t('step1Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 text-white">
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                    <ClipboardDocumentIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-2">02</div>
                    <h3 className="text-xl font-semibold mb-3">{t('step2')}</h3>
                    <p className="text-white/90">{t('step2Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative p-8 text-white">
                <div className="flex items-start space-x-4">
                  <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                    <TruckIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold mb-2">03</div>
                    <h3 className="text-xl font-semibold mb-3">{t('step3')}</h3>
                    <p className="text-white/90">{t('step3Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Отзывы клиентов */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Отзывы клиентов!!!
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Первый отзыв */}
            <div className="bg-white p-8 rounded-lg group hover:bg-gradient-to-r hover:from-[#f85125] hover:to-[#ff8b42] transition-all duration-300">
              <div className="mb-6">
                <div className="text-6xl text-[#f85125] opacity-20 group-hover:text-white">"</div>
                <p className="text-gray-700 group-hover:text-white">
                  Отличный магазин! Быстрая доставка и качественные товары. Всегда нахожу то, что нужно, по хорошим ценам.
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/images/cma6e8yo6000bl8030zicg77b.jpg"
                    alt="Аруна Т."
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-white">Аруна Тазабекова</h3>
                  <p className="text-gray-600 group-hover:text-white/80">Программист</p>
                </div>
              </div>
            </div>

            {/* Второй отзыв */}
            <div className="bg-white p-8 rounded-lg group hover:bg-gradient-to-r hover:from-[#f85125] hover:to-[#ff8b42] transition-all duration-300">
              <div className="mb-6">
                <div className="text-6xl text-[#f85125] opacity-20 group-hover:text-white">"</div>
                <p className="text-gray-700 group-hover:text-white">
                  Впервые заказал здесь и остался очень доволен. Сервис на высоте, буду рекомендовать друзьям!
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/images/cma6e5bv90009l803d5jijps0.jpg"
                    alt="Арлен Н."
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-white">Арлен Нурбеков</h3>
                  <p className="text-gray-600 group-hover:text-white/80">Инженер</p>
                </div>
              </div>
            </div>

            {/* Третий отзыв */}
            <div className="bg-white p-8 rounded-lg group hover:bg-gradient-to-r hover:from-[#f85125] hover:to-[#ff8b42] transition-all duration-300">
              <div className="mb-6">
                <div className="text-6xl text-[#f85125] opacity-20 group-hover:text-white">"</div>
                <p className="text-gray-700 group-hover:text-white">
                  Отзывчивая поддержка и удобный сайт. Заказываю уже третий раз, всё всегда на высшем уровне!
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/images/cma6ed1s5000fl8037bv9177b.jpg"
                    alt="Эльнура А."
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-white">Эльнура Алиева</h3>
                  <p className="text-gray-600 group-hover:text-white/80">Юрист</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Частые вопросы */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 relative">
            {t('faq')}
            <div className="absolute w-24 h-1 gradient-primary bottom-0 left-1/2 transform -translate-x-1/2 mt-4"></div>
          </h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="relative group">
                <div className="absolute inset-0 gradient-primary rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative overflow-hidden rounded-2xl">
                  <button
                    className="w-full px-6 py-4 text-left flex justify-between items-center text-white"
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className="text-lg font-semibold">{faq.question}</span>
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-transform duration-300 ${
                        openFAQ === index ? 'transform rotate-180' : ''
                      }`}
                    />
                  </button>
                  <div
                    className={`px-6 overflow-hidden transition-all duration-300 ${
                      openFAQ === index ? 'max-h-40 py-4' : 'max-h-0'
                    }`}
                  >
                    <p className="text-white/90">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Image
                  src="/images/logo.svg"
                  alt="KELKEL"
                  width={40}
                  height={40}
                  className="w-auto h-8"
                />
                <span className="text-2xl font-bold gradient-text">
                  АПАКАЙ
                </span>
              </div>
              <p className="text-gray-400">{t('storeDescription')}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6">{t('contacts')}</h3>
              <div className="space-y-3">
                <p className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                  <PhoneIcon className="h-5 w-5" />
                  <a href="tel:+996755183699" className="hover:underline">
                    +996755183699
                  </a>
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-6">{t('workingHours')}</h3>
              <div className="space-y-3">
                <p className="text-gray-400 flex items-center space-x-2">
                  <CalendarDateRangeIcon className="h-5 w-5" />
                  <span>{t('workingDays')}</span>
                </p>
                <p className="text-gray-400 flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>9:00-21:00</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 