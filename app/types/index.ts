export interface Image {
  id: string;
  url: string;
  productId: string;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category?: Category;
  images: ProductImage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  productsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface ProductImage {
  id: string;
  url: string;
  productId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
} 