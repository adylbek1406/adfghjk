import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем общее количество товаров
    const totalProducts = await prisma.product.count();

    // Получаем количество категорий
    const totalCategories = await prisma.category.count();

    // Получаем количество заказов
    const totalOrders = await prisma.order.count();

    // Получаем сумму всех заказов
    const orders = await prisma.order.findMany({
      select: {
        totalAmount: true
      }
    });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Получаем количество товаров по категориям
    const productsByCategory = await prisma.category.findMany({
      select: {
        name: true,
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return NextResponse.json({
      totalProducts,
      totalCategories,
      totalOrders,
      totalRevenue,
      productsByCategory: productsByCategory.map(category => ({
        name: category.name,
        count: category._count.products
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении статистики' },
      { status: 500 }
    );
  }
} 