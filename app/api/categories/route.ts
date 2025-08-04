import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const pageSize = 12;

    // Создаем условия для фильтрации
    const where: Prisma.CategoryWhereInput = search ? {
      name: {
        contains: search,
        mode: Prisma.QueryMode.insensitive
      }
    } : {};

    // Получаем общее количество категорий
    const total = await prisma.category.count({ where });

    // Получаем категории с пагинацией
    const categories = await prisma.category.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        products: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Форматируем категории для ответа
    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      description: category.description,
      slug: category.slug,
      productsCount: category.products.length
    }));

    return NextResponse.json({
      categories: formattedCategories,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 