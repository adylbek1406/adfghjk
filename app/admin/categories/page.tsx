'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import slugify from 'slugify';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  products: any[];
  createdAt: string;
}

interface FilterParams {
  search: string;
  sortBy: 'name' | 'createdAt' | 'productsCount';
  sortOrder: 'asc' | 'desc';
  page: number;
  perPage: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    perPage: 50
  });
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('1');

  useEffect(() => {
    fetchCategories();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const queryParams = new URLSearchParams({
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page.toString(),
        perPage: filters.perPage.toString()
      });

      const response = await fetch(`/api/admin/categories?${queryParams}`);
      if (!response.ok) {
        throw new Error('Ошибка при загрузке категорий');
      }
      const data = await response.json();
      
      // Проверяем структуру ответа и извлекаем категории
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
        setTotalCategories(data.total || data.categories.length);
        setTotalPages(data.totalPages || Math.ceil((data.total || data.categories.length) / filters.perPage));
      } else if (Array.isArray(data)) {
        setCategories(data);
        setTotalCategories(data.length);
        setTotalPages(Math.ceil(data.length / filters.perPage));
      } else {
        setCategories([]);
        setTotalCategories(0);
        setTotalPages(1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setCategories([]);
      setTotalCategories(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const slug = slugify(formData.name, { lower: true, strict: true });
      const endpoint = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : '/api/admin/categories';
      
      const response = await fetch(endpoint, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          slug
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при сохранении категории');
      }

      await fetchCategories();
      setIsModalOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/categories?ids=${categoryId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при удалении категории');
      }

      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  const applySearch = () => {
    setFilters(prev => ({ ...prev, search: searchValue, page: 1 }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySearch();
    }
  };

  const handleSort = (sortBy: FilterParams['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    setCurrentPage(page.toString());
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const page = parseInt(currentPage);
      if (!isNaN(page) && page > 0 && page <= Math.ceil(totalCategories / filters.perPage)) {
        handlePageChange(page);
      } else {
        setCurrentPage(filters.page.toString());
      }
    }
  };

  useEffect(() => {
    setCurrentPage(filters.page.toString());
  }, [filters.page]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-8">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">{error}</div>
          <button
            onClick={fetchCategories}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Категории</h1>
          <div className="flex gap-4">
            <button
              onClick={handleCreateCategory}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Добавить категорию
            </button>
          </div>
        </div>

        {/* Панель фильтров */}
        <div className="bg-gray-800/80 backdrop-blur-sm p-5 rounded-xl mb-6 shadow-xl shadow-black/20 border border-gray-700/50">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Поиск по названию..."
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={applySearch}
                  className="absolute right-0 top-0 h-full px-4 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 md:flex-initial md:w-48">
              <select
                value={filters.sortBy}
                onChange={(e) => handleSort(e.target.value as FilterParams['sortBy'])}
                className="w-full px-4 py-2.5 bg-gray-700/70 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary/70 transition-all duration-300 appearance-none cursor-pointer bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTQgNmw0IDQgNC00IiBzdHJva2U9IiM5Q0EzQUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+')] bg-no-repeat bg-right-4 bg-center-y"
              >
                <option value="name">По названию</option>
                <option value="createdAt">По дате создания</option>
                <option value="productsCount">По количеству товаров</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-5 py-3 rounded-lg mb-6 shadow-lg animate-pulse">
            {error}
          </div>
        )}

        <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-xl shadow-black/20 border border-gray-700/50">
          <table className="min-w-full divide-y divide-gray-700/50">
            <thead className="bg-gray-700/50">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('name')}
                >
                  Название {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('productsCount')}
                >
                  Товары {filters.sortBy === 'productsCount' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors duration-200"
                  onClick={() => handleSort('createdAt')}
                >
                  Дата создания {filters.sortBy === 'createdAt' && (filters.sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                    </div>
                    <p className="mt-4 text-gray-400">Загрузка категорий...</p>
                  </td>
                </tr>
              ) : categories && categories.length > 0 ? (
                categories.map((category) => (
                  <tr
                    key={category.id}
                    onClick={() => handleEditCategory(category)}
                    className="cursor-pointer hover:bg-blue-500/10 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {category.products?.length || 0} товаров
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                      {new Date(category.createdAt).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button 
                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category.id);
                        }}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                    {error ? (
                      <div className="flex flex-col items-center">
                        <p className="mb-4">{error}</p>
                        <button 
                          onClick={fetchCategories}
                          className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 text-white"
                        >
                          Попробовать снова
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <p className="text-xl mb-2">Категории не найдены</p>
                        <p className="text-gray-500 mb-4">Попробуйте изменить параметры поиска или добавьте новую категорию</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Пагинация */}
        {totalCategories > filters.perPage && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Показано {(filters.page - 1) * filters.perPage + 1} - {Math.min(filters.page * filters.perPage, totalCategories)} из {totalCategories}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors duration-200 shadow-lg shadow-black/20"
              >
                Назад
              </button>
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">Страница:</span>
                <input
                  type="text"
                  value={currentPage}
                  onChange={handlePageInputChange}
                  onKeyDown={handlePageInputKeyDown}
                  className="w-16 px-3 py-2 bg-gray-700/70 border border-gray-600/50 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-primary/70 transition-all duration-200"
                  aria-label="Номер страницы"
                />
                <span className="text-gray-400 ml-2">из {Math.ceil(totalCategories / filters.perPage)}</span>
              </div>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page * filters.perPage >= totalCategories}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors duration-200 shadow-lg shadow-black/20"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-6 w-full max-w-lg my-8 mx-4 relative shadow-2xl border border-gray-700/50 animate-scaleIn">
            <h2 className="text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              {editingCategory ? 'Редактировать категорию' : 'Добавить категорию'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Название
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/70 rounded-lg focus:ring-2 focus:ring-primary/70 outline-none transition-all duration-200 border border-gray-600/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  Описание
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/70 rounded-lg focus:ring-2 focus:ring-primary/70 outline-none transition-all duration-200 border border-gray-600/50"
                />
              </div>
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors duration-200 border border-gray-600 hover:border-gray-500 rounded-lg"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600 rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
                      Сохранение...
                    </span>
                  ) : (
                    editingCategory ? 'Сохранить' : 'Создать'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
} 