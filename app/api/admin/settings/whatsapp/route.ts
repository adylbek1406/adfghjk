import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/settings/whatsapp
export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: 'whatsapp_phone' }
    });

    return NextResponse.json(setting || { value: '' });
  } catch (error) {
    console.error('Error fetching whatsapp setting:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении настроек' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings/whatsapp
export async function PUT(request: Request) {
  try {
    const { value } = await request.json();

    if (!value) {
      return NextResponse.json(
        { error: 'Номер телефона обязателен' },
        { status: 400 }
      );
    }

    // Валидация формата номера телефона для Кыргызстана
    const phoneRegex = /^\+996\d{9}$/;
    if (!phoneRegex.test(value)) {
      return NextResponse.json(
        { error: 'Неверный формат номера телефона. Используйте формат: +996XXXXXXXXX' },
        { status: 400 }
      );
    }

    const setting = await prisma.settings.upsert({
      where: { key: 'whatsapp_phone' },
      update: { value },
      create: {
        key: 'whatsapp_phone',
        value
      }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating whatsapp setting:', error);
    return NextResponse.json(
      { error: 'Ошибка при обновлении настроек' },
      { status: 500 }
    );
  }
} 