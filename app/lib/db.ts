import { Product, Category, Image } from '@/app/types/index';
import { Pool } from 'pg';
import { PrismaClient, Prisma } from '@prisma/client';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient();

export default prisma;

export async function getCategories(
  search: string,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc'
) {
  const skip = (page - 1) * pageSize;
  const where: Prisma.CategoryWhereInput = search ? {
    name: {
      contains: search,
      mode: 'insensitive'
    }
  } : {};

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        products: {
          where: {
            isAvailable: true // Фильтруем только доступные товары
          }
        }
      }
    }),
    prisma.category.count({ where })
  ]);

  return {
    categories: categories.map(cat => ({
      ...cat,
      productsCount: cat.products.length // Теперь это количество только доступных товаров
    })),
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page
  };
}

type PriceRange = 'under_50000' | '50000_100000' | 'over_100000';
const priceRanges: Record<PriceRange, string> = {
  under_50000: 'price < 50000',
  '50000_100000': 'price >= 50000 AND price <= 100000',
  over_100000: 'price > 100000'
};

export async function getProducts(
  categoryId: string,
  search: string,
  page: number,
  pageSize: number,
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  filters: Record<string, any>
) {
  const skip = (page - 1) * pageSize;
  const where: Prisma.ProductWhereInput = {};

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } }
    ];
  }

  // Добавляем фильтры по цене
  if (filters.price_range) {
    const priceRanges: Record<string, { gte?: number; lte?: number }> = {
      under_50000: { lte: 50000 },
      '50000_100000': { gte: 50000, lte: 100000 },
      over_100000: { gte: 100000 }
    };

    if (filters.price_range.length > 0) {
      where.OR = filters.price_range.map((range: string) => ({
        price: priceRanges[range]
      }));
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: true,
        images: true
      }
    }),
    prisma.product.count({ where })
  ]);

  return {
    products,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page
  };
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          images: true,
          isAvailable: true,
        }
      }
    }
  });
}

export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: true
    }
  });
}

export async function getTelegramId() {
  try {
    const setting = await prisma.settings.findFirst({
      where: {
        key: 'telegram_id'
      },
      select: {
        value: true
      }
    });
    return setting?.value;
  } catch (error) {
    console.error('Error getting telegram_id:', error);
    throw error;
  }
} 