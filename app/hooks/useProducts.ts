import { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  images: {
    id: number;
    url: string;
  }[];
  isAvailable: boolean;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export function useProducts(
  categoryId: string = '',
  search: string = '',
  page: number = 1,
  sortBy: string = 'name',
  sortOrder: 'asc' | 'desc' = 'asc',
  filters: Record<string, any> = {}
) {
  const [data, setData] = useState<ProductsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          categoryId,
          search,
          page: page.toString(),
          sortBy,
          sortOrder,
          filters: JSON.stringify(filters)
        });

        const response = await fetch(`/api/products?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId, search, page, sortBy, sortOrder, JSON.stringify(filters)]);

  return { data, isLoading, error };
} 