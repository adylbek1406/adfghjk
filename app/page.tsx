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
  const [selectedLocation, setSelectedLocation] = useState(0); // 0 - Каракол (по умолчанию)
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
              <h2 className="text-4xl font-bold text-center mb-16">
                {t('ourAdvantages')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 p-6 rounded-lg shadow-md hover:shadow-lg">
                  <div className="bg-primary rounded-full p-4 mb-6">
                    <TruckIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{t('fastDelivery')}</h3>
                  <p className="text-gray-600">{t('fastDeliveryDesc')}</p>
                </div>

                <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 p-6 rounded-lg shadow-md hover:shadow-lg">
                  <div className="bg-primary rounded-full p-4 mb-6">
                    <ShieldCheckIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{t('qualityGuarantee')}</h3>
                  <p className="text-gray-600">{t('qualityGuaranteeDesc')}</p>
                </div>

                <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 p-6 rounded-lg shadow-md hover:shadow-lg">
                  <div className="bg-primary rounded-full p-4 mb-6">
                    <CubeIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{t('wideRange')}</h3>
                  <p className="text-gray-600">{t('wideRangeDesc')}</p>
                </div>

                <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 p-6 rounded-lg shadow-md hover:shadow-lg">
                  <div className="bg-primary rounded-full p-4 mb-6">
                    <HeartIcon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">{t('affordablePrices')}</h3>
                  <p className="text-gray-600">{t('affordablePricesDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Как купить */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            {t('howToBuy')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 group hover:bg-primary">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-primary group-hover:text-white mb-4">
                  <ShoppingBagIcon className="h-16 w-16" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-white">{t('step1')}</h3>
                <p className="text-gray-600 group-hover:text-white/90">{t('step1Desc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 group hover:bg-primary">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-primary group-hover:text-white mb-4">
                  <ClipboardDocumentIcon className="h-16 w-16" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-white">{t('step2')}</h3>
                <p className="text-gray-600 group-hover:text-white/90">{t('step2Desc')}</p>
              </div>
            </div>

            <div className="bg-white p-6 shadow-md hover:shadow-xl transition-all duration-300 group hover:bg-primary">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="text-primary group-hover:text-white mb-4">
                  <TruckIcon className="h-16 w-16" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 group-hover:text-white">{t('step3')}</h3>
                <p className="text-gray-600 group-hover:text-white/90">{t('step3Desc')}</p>
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
                    src="/images/директор.jpg"
                    alt="Арлен"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-white">Арлен</h3>
                  <p className="text-gray-600 group-hover:text-white/80">Директор</p>
                </div>
              </div>
            </div>

            {/* Второй отзыв */}
            <div className="bg-white p-8 rounded-lg group hover:bg-gradient-to-r hover:from-[#f85125] hover:to-[#ff8b42] transition-all duration-300">
              <div className="mb-6">
                <div className="text-6xl text-[#f85125] opacity-20 group-hover:text-white">"</div>
                <p className="text-gray-700 group-hover:text-white">
                  Прекрасный сервис и отличное качество обслуживания. Рекомендую всем, кто ищет надежный магазин техники.
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/images/директор.jpg"
                    alt="Эльнура"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg group-hover:text-white">Эльнура</h3>
                  <p className="text-gray-600 group-hover:text-white/80">Директор</p>
                </div>
              </div>
            </div>

            {/* Третий отзыв */}
            <div className="bg-white p-8 rounded-lg group hover:bg-gradient-to-r hover:from-[#f85125] hover:to-[#ff8b42] transition-all duration-300">
              <div className="mb-6">
                <div className="text-6xl text-[#f85125] opacity-20 group-hover:text-white">"</div>
                <p className="text-gray-700 group-hover:text-white">
                  Замечательный выбор техники и профессиональный подход к клиентам. Очень довольна покупками в этом магазине!
                </p>
              </div>
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4">
                  <Image
                    src="/images/гермиона.jpg"
                    alt="Аруна"
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
          </div>
        </div>
      </section>

      {/* Частые вопросы */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            {t('faq')}
          </h2>
          <p className="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
            {t('faqDescription')}
          </p>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-xl shadow-sm transition-all duration-300 hover:shadow-lg border-l-4 ${
                  openFAQ === index ? 'border-l-primary' : 'border-l-transparent'
                }`}
              >
                  <button
                  className="w-full px-8 py-6 text-left flex justify-between items-center gap-4"
                    onClick={() => toggleFAQ(index)}
                  >
                  <span className={`text-lg font-medium transition-colors duration-300 ${
                    openFAQ === index ? 'text-primary' : 'text-gray-900'
                  }`}>
                    {faq.question}
                  </span>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    openFAQ === index ? 'bg-primary rotate-180' : 'bg-gray-100'
                  }`}>
                    <ChevronDownIcon
                      className={`w-5 h-5 transition-colors duration-300 ${
                        openFAQ === index ? 'text-white' : 'text-gray-500'
                      }`}
                    />
                  </div>
                  </button>
                  <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFAQ === index ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                  <div className="px-8 pb-6">
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Карта */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            {t('ourLocation')}
          </h2>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Карта */}
            <div className="lg:w-2/3">
              <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1461.7818774622828!2d78.38235537970658!3d42.49255797971274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDI5JzMyLjEiTiA3OMKwMjInNTkuNCJF!5e0!3m2!1sru!2skg!4v1709825659387!5m2!1sru!2skg&markers=color:red%7C42.492558,78.38317"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Карта расположения магазина КЕЛКЕЛ"
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>

            {/* Выбор точек */}
            <div className="lg:w-1/3 space-y-4">
              <button 
                className={`w-full p-4 text-left rounded-lg border transition-colors group
                  ${selectedLocation === 0 
                    ? 'border-[#f85125] bg-[#f85125]/10' 
                    : 'border-gray-200 hover:border-[#f85125] hover:bg-[#f85125]/10'}`}
                onClick={() => {
                  setSelectedLocation(0);
                  const iframe = document.querySelector('iframe');
                  if (iframe) {
                    iframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1461.7818774622828!2d78.38235537970658!3d42.49255797971274!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDI5JzMyLjEiTiA3OMKwMjInNTkuNCJF!5e0!3m2!1sru!2skg!4v1709825659387!5m2!1sru!2skg&markers=color:red%7C42.492558,78.38317`;
                  }
                }}
              >
                <h3 className={`font-medium ${selectedLocation === 0 ? 'text-[#f85125]' : 'text-gray-900 group-hover:text-[#f85125]'}`}>г. Каракол</h3>
                <p className="text-gray-600">ул. Торгоева 42</p>
              </button>

              <button 
                className={`w-full p-4 text-left rounded-lg border transition-colors group
                  ${selectedLocation === 1 
                    ? 'border-[#f85125] bg-[#f85125]/10' 
                    : 'border-gray-200 hover:border-[#f85125] hover:bg-[#f85125]/10'}`}
                onClick={() => {
                  setSelectedLocation(1);
                  const iframe = document.querySelector('iframe');
                  if (iframe) {
                    iframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2923.5637549245657!2d74.613041!3d42.849555!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDUwJzU4LjQiTiA3NMKwMzYnNDcuMCJF!5e0!3m2!1sru!2skg!4v1709825659387!5m2!1sru!2skg&markers=color:red%7C42.849555,74.613041`;
                  }
                }}
              >
                <h3 className={`font-medium ${selectedLocation === 1 ? 'text-[#f85125]' : 'text-gray-900 group-hover:text-[#f85125]'}`}>г. Бишкек</h3>
                <p className="text-gray-600">ул. Скрябина, 78к</p>
              </button>

              <button 
                className={`w-full p-4 text-left rounded-lg border transition-colors group
                  ${selectedLocation === 2 
                    ? 'border-[#f85125] bg-[#f85125]/10' 
                    : 'border-gray-200 hover:border-[#f85125] hover:bg-[#f85125]/10'}`}
                onClick={() => {
                  setSelectedLocation(2);
                  const iframe = document.querySelector('iframe');
                  if (iframe) {
                    iframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2923.5637549245657!2d74.58279!3d42.879261!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDUyJzQ1LjMiTiA3NMKwMzQnNTguMCJF!5e0!3m2!1sru!2skg!4v1709825659387!5m2!1sru!2skg&markers=color:red%7C42.879261,74.58279`;
                  }
                }}
              >
                <h3 className={`font-medium ${selectedLocation === 2 ? 'text-[#f85125]' : 'text-gray-900 group-hover:text-[#f85125]'}`}>г. Бишкек</h3>
                <p className="text-gray-600">ул. Рыскулова, 30</p>
              </button>

              <button 
                className={`w-full p-4 text-left rounded-lg border transition-colors group
                  ${selectedLocation === 3 
                    ? 'border-[#f85125] bg-[#f85125]/10' 
                    : 'border-gray-200 hover:border-[#f85125] hover:bg-[#f85125]/10'}`}
                onClick={() => {
                  setSelectedLocation(3);
                  const iframe = document.querySelector('iframe');
                  if (iframe) {
                    iframe.src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2923.5637549245657!2d74.512684!3d42.844502!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDLCsDUwJzQwLjIiTiA3NMKwMzAnNDUuNyJF!5e0!3m2!1sru!2skg!4v1709825659387!5m2!1sru!2skg&markers=color:red%7C42.844502,74.512684`;
                  }
                }}
              >
                <h3 className={`font-medium ${selectedLocation === 3 ? 'text-[#f85125]' : 'text-gray-900 group-hover:text-[#f85125]'}`}>г. Бишкек</h3>
                <p className="text-gray-600">ул. Таш-Рабат, 70/1</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Первая колонка - О нас */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Image
                  src="/logo-small.svg"
                  alt="КЕЛКЕЛ"
                  width={40}
                  height={40}
                  className="w-auto h-14"
                />
              </div>
              <p className="text-gray-400">{t('storeDescription')}</p>
            </div>

            {/* Вторая колонка - Контакты */}
            <div>
              <h3 className="text-xl font-bold mb-6">{t('contacts')}</h3>
              <div className="space-y-4">
                <p className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                  <PhoneIcon className="h-5 w-5" />
                  <a href="tel:0505590590" className="hover:underline">
                    0505590590
                  </a>
                </p>
                <p className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                  <a href={`https://www.instagram.com/kelkel.karakol`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @kelkel.karakol
                  </a>
                </p>
                <p className="text-gray-400 hover:text-white transition-colors flex items-center space-x-2">
                  <a href={`https://wa.me/0505590590`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center">
                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                </p>
              </div>
            </div>

            {/* Третья колонка - График работы */}
            <div>
              <h3 className="text-xl font-bold mb-6">{t('workingHours')}</h3>
              <div className="space-y-3">
                <p className="text-gray-400 flex items-center space-x-2">
                  <CalendarDateRangeIcon className="h-5 w-5" />
                  <span>{t('workingDays')}</span>
                </p>
                <p className="text-gray-400 flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5" />
                  <span>{t('workingTime')}</span>
                </p>
              </div>
            </div>

            {/* Четвертая колонка - Адрес */}
            <div>
              <h3 className="text-xl font-bold mb-6">{t('address')}</h3>
              <div className="space-y-3">
                <p className="text-gray-400 flex items-start space-x-2">
                  <svg className="h-5 w-5 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t('storeAddress')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 