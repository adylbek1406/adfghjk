'use client';

import { useState, useEffect, useRef } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, MagnifyingGlassIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { generateSlug } from '@/app/utils/helpers';
import { v2 as cloudinary } from 'cloudinary';
import ImportExportModal from '@/app/components/ImportExportModal';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  products: any[];
}

interface ProductImage {
  id: string | number;
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  isAvailable: boolean;
  categoryId: string;
  category: {
    id: string;
    name: string;
  };
  images: ProductImage[];
  productImages?: ProductImage[];
}

interface NewProduct {
  name: string;
  slug: string;
  description: string;
  price: number;
  isAvailable: boolean;
  categoryId: string;
}

// Добавляем интерфейс для параметров фильтрации
interface FilterParams {
  search: string;
  categoryId: string;
  availability: 'all' | 'available' | 'unavailable';
  sortBy: 'name' | 'price' | 'category';
  sortOrder: 'asc' | 'desc';
  page: number;
  perPage: number;
}

// Конфигурация Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Функция для удаления изображения из Cloudinary через API
async function deleteImage(url: string) {
  try {
    const response = await fetch(`/api/admin/cloudinary?url=${encodeURIComponent(url)}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Ошибка при удалении изображения');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    name: '',
    slug: '',
    description: '',
    price: 0,
    isAvailable: true,
    categoryId: '',
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState<string | null>('');
  const [searchValue, setSearchValue] = useState('');
  const [filters, setFilters] = useState<FilterParams>({
    search: '',
    categoryId: '',
    availability: 'all',
    sortBy: 'name',
    sortOrder: 'asc',
    page: 1,
    perPage: 100
  });
  const [totalProducts, setTotalProducts] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState<string>('1');
  const [showImportExport, setShowImportExport] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [filters]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const searchParams = new URLSearchParams({
        search: filters.search,
        categoryId: filters.categoryId,
        availability: filters.availability,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: filters.page.toString(),
        perPage: filters.perPage.toString()
      });

      const response = await fetch(`/api/admin/products?${searchParams}`, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке товаров');
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalProducts(data.total);
      setError('');
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при загрузке товаров');
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories?all=true'); // Запрашиваем все категории
      if (!response.ok) {
        throw new Error('Ошибка при загрузке категорий');
      }
      const data = await response.json();
      
      // Правильно обрабатываем ответ от API
      const categoriesData = Array.isArray(data) ? data : (data.categories || []);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Ошибка при загрузке категорий:', error);
      setError('Ошибка при загрузке категорий');
      setCategories([]);
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setNewProduct({
      name: '',
      slug: '',
      description: '',
      price: 0,
      isAvailable: true,
      categoryId: '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      isAvailable: product.isAvailable,
      categoryId: product.categoryId,
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const uploadImages = async (name: string) => {
    const uploadedUrls: string[] = [];
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const { imageUrl } = await response.json();
        uploadedUrls.push(imageUrl);
      }
    }
    
    return uploadedUrls;
  };

  const handleDeleteImage = async (imageId: string | number) => {
    if (!editingProduct) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products/${editingProduct.id}/images/${imageId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении изображения');
      }
      
      // Получаем URL изображения из текущего состояния
      const imageToDelete = editingProduct.images.find(img => img.id === imageId);
      if (imageToDelete) {
        // Удаляем файл изображения
        await deleteImage(imageToDelete.url);
      }
      
      // Обновляем список изображений в редактируемом продукте
      const updatedImages = (editingProduct.images || editingProduct.productImages || [])
        .filter(img => img.id !== imageId);
      
      setEditingProduct({
        ...editingProduct,
        images: updatedImages,
        productImages: updatedImages
      });
      
      // Если удалили все изображения, показываем сообщение о добавлении изображения по умолчанию
      if (updatedImages.length === 0 && selectedFiles.length === 0) {
        // Изображение по умолчанию будет добавлено автоматически на сервере
        // Обновляем UI, чтобы показать пользователю, что будет использовано изображение по умолчанию
        const defaultImage: ProductImage = {
          id: 'default-temp',
          url: '/images/product-default.png'
        };
        
        setEditingProduct({
          ...editingProduct,
          images: [defaultImage],
          productImages: [defaultImage]
        });
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      alert(error instanceof Error ? error.message : 'Ошибка при удалении изображения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Сначала загружаем изображения
      const uploadedImageUrls = [];
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', newProduct.name);
        
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке изображения');
        }
        
        const data = await response.json();
        uploadedImageUrls.push(data.imageUrl);
      }
      
      // Затем создаем или обновляем продукт
      const productFormData = new FormData();
      productFormData.append('name', newProduct.name);
      productFormData.append('slug', newProduct.slug || generateSlug(newProduct.name));
      productFormData.append('description', newProduct.description || '');
      productFormData.append('price', newProduct.price.toString());
      productFormData.append('categoryId', newProduct.categoryId);
      productFormData.append('isAvailable', newProduct.isAvailable.toString());
      
      // Добавляем URL загруженных изображений
      uploadedImageUrls.forEach(url => {
        productFormData.append('imageUrls', url);
      });
      
      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        body: productFormData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при сохранении товара');
      }

      const savedProduct = await response.json();
      
      // Обновляем список продуктов
      setProducts(prevProducts => {
        if (editingProduct) {
          return prevProducts.map(p => 
            p.id === savedProduct.id ? savedProduct : p
          );
        } else {
          return [savedProduct, ...prevProducts];
        }
      });

      // Сбрасываем форму
      setNewProduct({
        name: '',
        slug: '',
        description: '',
        price: 0,
        isAvailable: true,
        categoryId: ''
      });
      setSelectedFiles([]);
      setIsModalOpen(false);
      
      // Обновляем список продуктов
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при сохранении товара');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setProducts(products.filter(p => p.id !== productId));
        } else {
          const error = await response.json();
          alert(error.error);
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Ошибка при удалении товара');
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (name === 'price') {
      // Преобразуем строку в число для цены
      setNewProduct(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (name === 'isAvailable') {
      // Обрабатываем чекбокс
      setNewProduct(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (name === 'categoryId') {
      // Обрабатываем выбор категории
      setNewProduct(prev => ({
        ...prev,
        [name]: value || ''
      }));
    } else {
      // Обрабатываем остальные поля
      setNewProduct(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Добавляем функции для управления фильтрами
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

  const handleCategoryFilter = (categoryId: string) => {
    setFilters(prev => ({ ...prev, categoryId, page: 1 }));
  };

  const handleAvailabilityFilter = (availability: FilterParams['availability']) => {
    setFilters(prev => ({ ...prev, availability, page: 1 }));
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
      if (!isNaN(page) && page > 0 && page <= Math.ceil(totalProducts / filters.perPage)) {
        handlePageChange(page);
      } else {
        setCurrentPage(filters.page.toString());
      }
    }
  };

  useEffect(() => {
    setCurrentPage(filters.page.toString());
  }, [filters.page]);

  // Функция для обрезки длинного текста
  const truncateText = (text: string, maxLength: number = 30) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Товары</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setShowImportExport(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Импорт/Экспорт
            </button>
            <button
              onClick={handleAddProduct}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Добавить товар
            </button>
          </div>
        </div>

        {/* Поисковая строка */}
        <div className="relative mb-4">
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

        {/* Фильтры и сортировка */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Фильтр по категориям */}
          <select
            value={filters.categoryId}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">Все категории</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {/* Фильтр по наличию */}
          <select
            value={filters.availability}
            onChange={(e) => handleAvailabilityFilter(e.target.value as 'all' | 'available' | 'unavailable')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">Все товары</option>
            <option value="available">В наличии</option>
            <option value="unavailable">Нет в наличии</option>
          </select>

          {/* Сортировка */}
          <select
            value={filters.sortBy}
            onChange={(e) => handleSort(e.target.value as 'name' | 'price' | 'category')}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="name">Сортировать по названию</option>
            <option value="price">Сортировать по цене</option>
            <option value="category">Сортировать по категории</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-5 py-3 rounded-lg mb-6 shadow-lg animate-pulse">
            {error}
          </div>
        )}

        {/* Таблица */}
        <div className="mt-4 bg-gray-900/50 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead className="bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Название
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Категория
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Цена
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Статус
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Изображения
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Описание
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {products.map((product) => (
                  <tr
                    key={product.id}
                    onClick={() => handleEditProduct(product)}
                    className="cursor-pointer hover:bg-blue-500/10 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">{product.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-400">{product.category?.name || 'Без категории'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-blue-500 font-medium">
                        {product.price.toLocaleString('ru-RU')} сом
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        product.isAvailable
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {product.isAvailable ? 'В наличии' : 'Нет в наличии'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex -space-x-3">
                        {(product.images || []).slice(0, 3).map((image, index) => (
                          <img
                            key={image.id || index}
                            src={image.url}
                            alt=""
                            className="w-10 h-10 rounded-full border-2 border-gray-800 object-cover hover:scale-110 transition-transform z-[1] hover:z-10"
                          />
                        ))}
                        {(product.images || []).length > 3 && (
                          <div className="w-10 h-10 rounded-full border-2 border-gray-800 bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-300 z-[1]">
                            +{(product.images || []).length - 3}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-400 max-w-xs truncate">
                        {product.description || 'Нет описания'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProduct(product);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteProduct(product.id);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Пагинация */}
        {totalProducts > filters.perPage && (
          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Показано {(filters.page - 1) * filters.perPage + 1} - {Math.min(filters.page * filters.perPage, totalProducts)} из {totalProducts}
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
                <span className="text-gray-400 ml-2">из {Math.ceil(totalProducts / filters.perPage)}</span>
              </div>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page * filters.perPage >= totalProducts}
                className="px-5 py-2.5 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors duration-200 shadow-lg shadow-black/20"
              >
                Вперед
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Название
                </label>
                <input
                  type="text"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Цена (сом)
                </label>
                <input
                  type="number"
                  name="price"
                  value={newProduct.price}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Категория
                </label>
                <select
                  name="categoryId"
                  value={newProduct.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Изображения
                </label>
                <div className="space-y-4">
                  {editingProduct && editingProduct.images && editingProduct.images.length > 0 && (
                    <div className="flex flex-wrap gap-4">
                      {editingProduct.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt=""
                            className="w-24 h-24 object-cover rounded-lg border-2 border-gray-700"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(image.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-medium
                      file:bg-blue-600 file:text-white
                      file:cursor-pointer file:hover:bg-blue-700
                      file:transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isAvailable"
                  checked={newProduct.isAvailable}
                  onChange={(e) => handleInputChange(e)}
                  className="w-4 h-4 text-blue-600 border-gray-700 rounded focus:ring-blue-500 focus:ring-offset-gray-900"
                />
                <label className="ml-2 text-sm font-medium text-gray-300">
                  В наличии
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Сохранение...' : editingProduct ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportExport && (
        <ImportExportModal
          onClose={() => {
            setShowImportExport(false);
            fetchProducts();
          }}
        />
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