'use client';

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useLanguageContext } from '@/app/contexts/LanguageContext';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { parsePhoneNumber, isValidPhoneNumber, CountryCode } from 'libphonenumber-js';

interface OrderFormProps {
  cartItems: Array<{
    product: {
      id: string;
      name: string;
      price: number;
    };
    quantity: number;
  }>;
  totalSum: number;
  onClose: () => void;
}

// Список популярных стран с их кодами
const popularCountries = [
  { code: 'KG', name: 'Кыргызстан', dialCode: '+996' },
  { code: 'RU', name: 'Россия', dialCode: '+7' },
  { code: 'KZ', name: 'Казахстан', dialCode: '+7' },
  { code: 'UZ', name: 'Узбекистан', dialCode: '+998' },
  { code: 'TJ', name: 'Таджикистан', dialCode: '+992' },
];

export default function OrderForm({ cartItems, totalSum, onClose }: OrderFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    contactType: 'whatsapp',
    phone: '',
    countryCode: 'KG' as CountryCode
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const { t, language } = useLanguageContext();
  const router = useRouter();

  // Валидация телефонного номера
  const validatePhoneNumber = (phoneNumber: string, countryCode: CountryCode) => {
    try {
      if (!phoneNumber) {
        setPhoneError(t('phoneRequired'));
        return false;
      }

      // Добавляем код страны, если его нет
      const fullNumber = phoneNumber.startsWith('+') ? phoneNumber : `${popularCountries.find(c => c.code === countryCode)?.dialCode}${phoneNumber}`;
      
      if (!isValidPhoneNumber(fullNumber, countryCode)) {
        setPhoneError(t('invalidPhone'));
        return false;
      }

      const parsedNumber = parsePhoneNumber(fullNumber, countryCode);
      if (!parsedNumber?.isValid()) {
        setPhoneError(t('invalidPhone'));
        return false;
      }

      setPhoneError('');
      return parsedNumber.format('E.164'); // Возвращаем номер в международном формате
    } catch (error) {
      setPhoneError(t('invalidPhone'));
      return false;
    }
  };

  const sendToTelegram = async (orderData: any) => {
    try {
      const response = await fetch('/api/orders/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...orderData,
          language
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('orderError'));
      }

      return true;
    } catch (error) {
      console.error('Ошибка отправки заказа:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Валидация телефона перед отправкой
    const validatedPhone = validatePhoneNumber(formData.phone, formData.countryCode);
    if (!validatedPhone) {
      setIsSubmitting(false);
      return;
    }

    try {
      const items = cartItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        id: item.product.id
      }));

      await sendToTelegram({
        name: formData.name.trim(),
        phone: validatedPhone,
        contactType: formData.contactType,
        items,
        totalSum
      });

      Cookies.remove('cart');
      localStorage.removeItem('cartPrices');
      localStorage.removeItem('productDetails');

      window.dispatchEvent(new CustomEvent('cartUpdate', {
        detail: {
          cartData: {},
        }
      }));

      onClose();
      router.push('/cart');
      window.location.reload();
    } catch (err) {
      console.error('Ошибка при оформлении заказа:', err);
      setError(err instanceof Error ? err.message : t('orderError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Очищаем ошибку телефона при изменении номера или страны
    if (name === 'phone' || name === 'countryCode') {
      setPhoneError('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('checkout')}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={t('close')}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-300"
                  placeholder={t('enterFullName')}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="contactType" className="block text-sm font-semibold text-gray-700">
                  {t('contactType')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm focus-within:border-primary transition-all duration-300">
                    <input
                      type="radio"
                      name="contactType"
                      value="whatsapp"
                      checked={formData.contactType === 'whatsapp'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className={`flex items-center justify-center text-sm font-medium ${formData.contactType === 'whatsapp' ? 'text-primary' : 'text-gray-700'}`}>
                      WhatsApp
                    </span>
                    {formData.contactType === 'whatsapp' && (
                      <span className="absolute inset-0 border-2 border-primary rounded-xl"></span>
                    )}
                  </label>
                  <label className="relative flex cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm focus-within:border-primary transition-all duration-300">
                    <input
                      type="radio"
                      name="contactType"
                      value="call"
                      checked={formData.contactType === 'call'}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className={`flex items-center justify-center text-sm font-medium ${formData.contactType === 'call' ? 'text-primary' : 'text-gray-700'}`}>
                      {t('call')}
                    </span>
                    {formData.contactType === 'call' && (
                      <span className="absolute inset-0 border-2 border-primary rounded-xl"></span>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                  {t('phone')}
                </label>
                <div className="flex gap-2">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-300"
                  >
                    {popularCountries.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.dialCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:border-primary focus:ring-primary transition-all duration-300"
                    placeholder={t('enterPhone')}
                  />
                </div>
                {phoneError && (
                  <p className="text-sm text-red-500 mt-1">{phoneError}</p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-500 border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4 pt-4">
                <div className="text-xl font-bold text-gray-900 flex items-center justify-between">
                  <span>{t('total')}:</span>
                  <span className="gradient-text">{totalSum.toLocaleString('ru-RU')} {t('currency')}</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl gradient-primary px-6 py-4 text-white text-lg font-semibold hover:opacity-90 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  {isSubmitting ? t('processing') : t('placeOrder')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 