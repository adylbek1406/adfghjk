'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  TagIcon, 
  ShoppingBagIcon, 
  Cog6ToothIcon,
  HomeIcon,
  CreditCardIcon
} from '@heroicons/react/24/solid';
import LogoutButton from './LogoutButton';

const Sidebar = () => {
  const menuItems = [
    { name: 'Дашборд', icon: ChartBarIcon, href: '/admin' },
    { name: 'Категории', icon: TagIcon, href: '/admin/categories' },
    { name: 'Товары', icon: ShoppingBagIcon, href: '/admin/products' },
    { name: 'Настройки', icon: Cog6ToothIcon, href: '/admin/settings' },
    { name: 'Рассрочки', icon: CreditCardIcon, href: '/admin/settings/installment' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 text-white p-4">
      <div className="flex items-center space-x-2 mb-8">
        <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          KELKEL
        </span>
        <span className="text-sm text-gray-400">Admin</span>
      </div>
      
      <nav className="space-y-1">
        <Link 
          href="/" 
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <HomeIcon className="w-5 h-5" />
          <span>На сайт</span>
        </Link>
        
        <div className="h-px bg-gradient-to-r from-gray-800 to-transparent my-4" />
        
        {menuItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="border-t border-white/10 p-2">
        <LogoutButton />
      </div>
    </div>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Sidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
} 