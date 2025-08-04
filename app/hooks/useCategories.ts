import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  productsCount: number;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useCategories(
  search: string = '',
  page: number = 1,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  const [data, setData] = useState<CategoriesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          search,
          page: page.toString(),
          sortBy,
          sortOrder
        });

        const response = await fetch(`/api/categories?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const result = await response.json();
        
        // Проверяем структуру ответа
        if (!result.categories) {
          throw new Error('Invalid response format');
        }

        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        // Устанавливаем пустой результат в случае ошибки
        setData({
          categories: [],
          total: 0,
          totalPages: 1,
          currentPage: page
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [search, page, sortBy, sortOrder]);

  return { data, isLoading, error };
} 