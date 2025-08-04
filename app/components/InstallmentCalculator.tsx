'use client';

import { useState, useEffect } from 'react';
import { useLanguageContext } from '@/app/contexts/LanguageContext';

interface InstallmentOption {
  months: string;
  percent: number;
}

interface InstallmentCalculatorProps {
  price: number;
}

export default function InstallmentCalculator({ price }: InstallmentCalculatorProps) {
  const { t } = useLanguageContext();
  const [installments, setInstallments] = useState<InstallmentOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<InstallmentOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstallments = async () => {
      try {
        const response = await fetch('/api/settings/installment');
        const data = await response.json();
        setInstallments(data.installments || []);
      } catch (error) {
        console.error('Error fetching installments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstallments();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-40 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (installments.length === 0) {
    return null;
  }

  const getMonthsNumber = (monthsRange: string): number => {
    return parseInt(monthsRange.split('-')[0]);
  };

  const handleOptionClick = (option: InstallmentOption) => {
    if (selectedOption?.months === option.months) {
      setSelectedOption(null);
    } else {
      setSelectedOption(option);
    }
  };

  const calculateInstallment = () => {
    if (!selectedOption) return null;

    const totalAmount = price * (1 + selectedOption.percent / 100);
    const monthlyPayment = totalAmount / getMonthsNumber(selectedOption.months);
    const markup = totalAmount - price;

    return {
      totalAmount,
      monthlyPayment,
      markup
    };
  };

  const calculations = calculateInstallment();

  return (
    <div className="mt-6 p-4 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{t('installmentCalculator')}</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        {installments.map((option) => (
          <button
            key={option.months}
            onClick={() => handleOptionClick(option)}
            className={`p-3 rounded-lg text-sm font-medium transition-colors
              ${selectedOption?.months === option.months
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {option.months} {t('months')}
          </button>
        ))}
      </div>

      {selectedOption && calculations && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>{t('originalPrice')}</span>
            <span className="font-medium">{price.toLocaleString('ru-RU')} {t('currency')}</span>
          </div>
          
          <div className="flex justify-between text-gray-600">
            <span>{t('markup')}:</span>
            <span className="font-medium">+{calculations.markup.toLocaleString('ru-RU')} {t('currency')}</span>
          </div>
          
          <div className="flex justify-between text-gray-900 font-medium">
            <span>{t('totalAmount')}</span>
            <span>{calculations.totalAmount.toLocaleString('ru-RU')} {t('currency')}</span>
          </div>
          
          <div className="flex justify-between text-primary font-medium pt-2 border-t">
            <span>{t('monthlyPayment')}</span>
            <span>{Math.ceil(calculations.monthlyPayment).toLocaleString('ru-RU')} {t('currency')}</span>
          </div>
        </div>
      )}
    </div>
  );
} 