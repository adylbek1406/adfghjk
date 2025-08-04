import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

interface CategoryData {
  name: string;
  description?: string;
  slug?: string;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json() as CategoryData;
    const categoryId = params.id;

    // Проверяем обязательные поля
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
      where: {
        slug,
        id: { not: categoryId }
      }
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: 'Категория с таким URL уже существует' },
        { status: 400 }
      );
    }

    // Получаем текущую категорию
    const currentCategory = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!currentCategory) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Обновляем категорию
    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: data.name,
        description: data.description,
        slug
      },
      include: {
        products: {
          include: {
            images: true
          }
        }
      }
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении категории' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: {
          include: {
            images: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении категории' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;

    // Проверяем существование категории
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        products: true
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Категория не найдена' },
        { status: 404 }
      );
    }

    // Проверяем, есть ли товары в категории
    if (category.products.length > 0) {
      return NextResponse.json(
        { error: 'Нельзя удалить категорию, содержащую товары' },
        { status: 400 }
      );
    }

    // Удаляем категорию
    await prisma.category.delete({
      where: { id: categoryId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении категории' },
      { status: 500 }
    );
  }
} 