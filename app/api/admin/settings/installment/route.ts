import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst({
      where: {
        key: 'installment'
      }
    });

    return NextResponse.json({ 
      installments: settings?.value ? JSON.parse(settings.value) : [] 
    });
  } catch (error) {
    console.error('Error fetching installment settings:', error);
    return NextResponse.json({ error: 'Failed to fetch installment settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { installments } = body;

    // Валидация данных
    if (!Array.isArray(installments)) {
      return NextResponse.json({ error: 'Invalid installments data' }, { status: 400 });
    }

    for (const item of installments) {
      if (!item.months || !item.percent || typeof item.percent !== 'number') {
        return NextResponse.json({ error: 'Invalid installment item format' }, { status: 400 });
      }
    }

    // Обновляем или создаем настройки
    await prisma.settings.upsert({
      where: {
        key: 'installment'
      },
      update: {
        value: JSON.stringify(installments)
      },
      create: {
        key: 'installment',
        value: JSON.stringify(installments)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating installment settings:', error);
    return NextResponse.json({ error: 'Failed to update installment settings' }, { status: 500 });
  }
} 