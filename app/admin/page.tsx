'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBagIcon, 
  FolderIcon, 
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Stats {
  totalProducts: number;
  totalCategories: number;
  availableProducts: number;
  unavailableProducts: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalCategories: 0,
    availableProducts: 0,
    unavailableProducts: 0
  });
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    fetchStats();
    setCurrentTime(new Date().toLocaleString('ru-RU'));
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Панель управления</h1>
        <div className="text-sm text-gray-500 mt-2">
          Последнее обновление: {currentTime}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Всего товаров */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-xl p-6 border border-blue-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ShoppingBagIcon className="h-6 w-6 text-blue-500" />
            </div>
            <span className="text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">
              Всего
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
            <p className="text-sm text-gray-400">Товаров в каталоге</p>
          </div>
        </div>

        {/* В наличии */}
        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-6 border border-green-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-500" />
            </div>
            <span className="text-xs font-medium text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              Доступно
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.availableProducts}</p>
            <p className="text-sm text-gray-400">Товаров в наличии</p>
          </div>
        </div>

        {/* Нет в наличии */}
        <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-xl p-6 border border-red-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircleIcon className="h-6 w-6 text-red-500" />
            </div>
            <span className="text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-full">
              Отсутствует
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.unavailableProducts}</p>
            <p className="text-sm text-gray-400">Нет в наличии</p>
          </div>
        </div>

        {/* Категории */}
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-6 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <FolderIcon className="h-6 w-6 text-purple-500" />
            </div>
            <span className="text-xs font-medium text-purple-500 bg-purple-500/10 px-2 py-1 rounded-full">
              Разделы
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-white">{stats.totalCategories}</p>
            <p className="text-sm text-gray-400">Категорий товаров</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/products"
          className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300"
        >
          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
              Управление товарами
            </h2>
            <p className="text-gray-400">
              Добавление, редактирование и удаление товаров в каталоге
            </p>
          </div>
          <ShoppingBagIcon className="absolute right-4 bottom-4 h-20 w-20 text-gray-800 group-hover:text-gray-700 transition-colors" />
        </Link>

        <Link
          href="/admin/categories"
          className="group relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-all duration-300"
        >
          <div className="relative z-10">
            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
              Управление категориями
            </h2>
            <p className="text-gray-400">
              Организация и структурирование каталога товаров
            </p>
          </div>
          <FolderIcon className="absolute right-4 bottom-4 h-20 w-20 text-gray-800 group-hover:text-gray-700 transition-colors" />
        </Link>
      </div>
    </div>
  );
} 