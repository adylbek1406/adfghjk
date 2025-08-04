import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  description?: string;
  slug?: string;
}

interface CategoryWithCount {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  products: any[];
  _count: {
    products: number;
  };
}

interface FormattedCategory {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  products: any[];
  productsCount: number;
}

// GET /api/admin/categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
    const all = searchParams.get('all') === 'true';
    const page = all ? 1 : parseInt(searchParams.get('page') || '1');
    const perPage = all ? 0 : parseInt(searchParams.get('perPage') || '10');

    // Создаем условия для фильтрации
    let where = {};
    
    // Поиск по названию или описанию
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    // Получаем общее количество категорий
    const total = await prisma.category.count({ where });

    // Получаем категории с пагинацией или все сразу
    const categories = await prisma.category.findMany({
      where,
      include: {
        products: true,
        _count: {
          select: { products: true }
        }
      },
      ...(all ? {} : {
        skip: (page - 1) * perPage,
        take: perPage
      })
    });

    // Форматируем ответ и сортируем
    let formattedCategories = categories.map((category: CategoryWithCount): FormattedCategory => {
      const { _count, ...rest } = category;
      return {
        ...rest,
        productsCount: _count.products
      };
    });

    // Сортируем результаты
    if (sortBy === 'productsCount') {
      formattedCategories.sort((a: FormattedCategory, b: FormattedCategory) => {
        return sortOrder === 'asc' 
          ? a.productsCount - b.productsCount
          : b.productsCount - a.productsCount;
      });
    } else if (sortBy === 'name' || sortBy === 'createdAt') {
      formattedCategories.sort((a: FormattedCategory, b: FormattedCategory) => {
        const aValue = String(a[sortBy as keyof FormattedCategory]);
        const bValue = String(b[sortBy as keyof FormattedCategory]);
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    // Если запрошены все категории, возвращаем их как есть
    if (all) {
      return NextResponse.json(formattedCategories);
    }

    // Вычисляем общее количество страниц
    const totalPages = Math.ceil(total / perPage);
    
    return NextResponse.json({
      categories: formattedCategories,
      total,
      totalPages,
      page,
      perPage
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении категорий' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories
export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as CategoryData;
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Название категории обязательно' },
        { status: 400 }
      );
    }
    
    // Генерируем slug из названия, если он не предоставлен
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    
    // Проверяем уникальность slug
    const existingCategory = await prisma.category.findFirst({
      where: { slug } as any
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Категория с таким URL уже существует' },
        { status: 400 }
      );
    }
    
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null,
        slug
      } as any
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Ошибка при создании категории' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories/:id
export async function PUT(request: NextRequest) {
  try {
    const id = request.url.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { error: 'ID категории не указан' },
        { status: 400 }
      );
    }
    
    const data = await request.json() as CategoryData;
    
    if (!data.name) {
      return NextResponse.json(
        { error: 'Название категории обязательно' },
        { status: 400 }
      );
    }
    
    // Генерируем slug из названия, если он не предоставлен
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });
    
    // Проверяем уникальность slug, исключая текущую категорию
    const existingCategory = await prisma.category.findFirst({
      where: {
        slug,
        NOT: { id }
      } as any
    });
    
    if (existingCategory) {
      return NextResponse.json(
        { error: 'Категория с таким URL уже существует' },
        { status: 400 }
      );
    }
    
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        slug
      } as any
    });
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении категории' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories?ids=id1,id2,id3
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids')?.split(',') || [];
    
    if (ids.length === 0) {
      return NextResponse.json(
        { error: 'Не указаны ID категорий для удаления' },
        { status: 400 }
      );
    }
    
    // Проверяем, есть ли товары в категориях
    const categoriesWithProducts = await prisma.category.findMany({
      where: {
        id: { in: ids },
        products: { some: {} }
      }
    });
    
    if (categoriesWithProducts.length > 0) {
      return NextResponse.json(
        { 
          error: 'Нельзя удалить категории, содержащие товары',
          categories: categoriesWithProducts.map(c => c.name)
        },
        { status: 400 }
      );
    }
    
    // Удаляем все указанные категории
    await prisma.category.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting categories:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении категорий' },
      { status: 500 }
    );
  }
} 