import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    // Получаем уникальные названия товаров, которые содержат поисковый запрос
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      select: {
        name: true,
        category: {
          select: {
            name: true
          }
        }
      },
      distinct: ['name'],
      take: 10 // Ограничиваем количество подсказок
    });

    // Форматируем результаты
    const suggestions = products.map(product => ({
      text: product.name,
      category: product.category?.name || null
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Failed to fetch suggestions' }, { status: 500 });
  }
} 