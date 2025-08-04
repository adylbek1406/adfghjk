import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: {
        key: 'advertising_pictures'
      }
    });

    return NextResponse.json(setting || { value: '[]' });
  } catch (error) {
    console.error('Ошибка при получении изображений для карусели:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
} 