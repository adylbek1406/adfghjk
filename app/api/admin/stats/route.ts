import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const [totalProducts, totalCategories, availableProducts, unavailableProducts] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.product.count({
        where: {
          isAvailable: true
        }
      }),
      prisma.product.count({
        where: {
          isAvailable: false
        }
      })
    ]);

    return NextResponse.json({
      totalProducts,
      totalCategories,
      availableProducts,
      unavailableProducts
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
} 