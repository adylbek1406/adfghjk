import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const filtersStr = searchParams.get('filters') || '{}';
    const filters = JSON.parse(filtersStr);
    const pageSize = 12;

    // Создаем базовые условия для фильтрации
    const where: Prisma.ProductWhereInput = {
      isAvailable: true // Показываем только доступные товары
    };

    // Добавляем фильтр по категории
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Добавляем поиск по названию или описанию
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Добавляем фильтры по цене
    if (filters.price_range && filters.price_range.length > 0) {
      const priceConditions = filters.price_range.map((range: string) => {
        switch (range) {
          case 'under_50000':
            return { price: { lt: 50000 } };
          case '50000_100000':
            return {
              AND: [
                { price: { gte: 50000 } },
                { price: { lte: 100000 } }
              ]
            };
          case 'over_100000':
            return { price: { gt: 100000 } };
          default:
            return null;
        }
      }).filter(Boolean);

      if (priceConditions.length > 0) {
        where.OR = priceConditions;
      }
    }

    // Получаем общее количество товаров
    const total = await prisma.product.count({ where });

    // Получаем товары с пагинацией
    const products = await prisma.product.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        images: {
          select: {
            id: true,
            url: true
          }
        }
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    return NextResponse.json({
      products,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 