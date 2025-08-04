export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
  images: {
    id: number;
    url: string;
  }[];
  isAvailable: boolean;
} 