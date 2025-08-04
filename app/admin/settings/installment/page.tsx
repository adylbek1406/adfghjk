'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface InstallmentOption {
  months: string;
  percent: number;
}

export default function InstallmentSettingsPage() {
  const [installments, setInstallments] = useState<InstallmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    try {
      const response = await fetch('/api/admin/settings/installment');
      const data = await response.json();
      setInstallments(data.installments || []);
      setError('');
    } catch (error) {
      console.error('Error fetching installments:', error);
      setError('Ошибка при загрузке настроек рассрочки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    setInstallments([...installments, { months: '', percent: 0 }]);
  };

  const handleRemoveOption = (index: number) => {
    setInstallments(installments.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof InstallmentOption, value: string | number) => {
    const newInstallments = [...installments];
    if (field === 'percent') {
      newInstallments[index][field] = Number(value);
    } else {
      newInstallments[index][field] = value as string;
    }
    setInstallments(newInstallments);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/settings/installment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ installments }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setSuccess('Настройки рассрочки успешно сохранены');
    } catch (error) {
      console.error('Error saving installments:', error);
      setError('Ошибка при сохранении настроек рассрочки');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/4"></div>
            <div className="h-[120px] bg-gray-800 rounded"></div>
            <div className="h-[120px] bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Настройки рассрочки
        </h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {installments.map((option, index) => (
            <div key={index} className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Вариант рассрочки #{index + 1}</h3>
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Срок (месяцы)
                  </label>
                  <input
                    type="text"
                    value={option.months}
                    onChange={(e) => handleChange(index, 'months', e.target.value)}
                    placeholder="Например: 3-6"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Процент наценки
                  </label>
                  <input
                    type="number"
                    value={option.percent}
                    onChange={(e) => handleChange(index, 'percent', e.target.value)}
                    min="0"
                    step="0.1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md 
                hover:bg-gray-600 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-1" />
              Добавить вариант
            </button>
            
            <button
              type="submit"
              disabled={isSaving}
              className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md 
                hover:bg-green-500 transition-colors ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 