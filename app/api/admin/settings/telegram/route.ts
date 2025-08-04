import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/settings/telegram
export async function GET() {
  try {
    const setting = await prisma.settings.findFirst({
      where: { key: 'telegram_id' }
    });

    return new Response(setting?.value || '', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error getting telegram settings:', error);
    return new Response('Ошибка при получении настроек Telegram', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// POST /api/admin/settings/telegram
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const telegramId = formData.get('telegramId');

    if (!telegramId) {
      return new Response('ID Telegram не указан', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const cleanTelegramId = telegramId.toString().trim();
    if (!/^\d+$/.test(cleanTelegramId)) {
      return new Response('ID Telegram должен содержать только цифры', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    await prisma.settings.upsert({
      where: { key: 'telegram_id' },
      update: { value: cleanTelegramId },
      create: {
        key: 'telegram_id',
        value: cleanTelegramId
      }
    });

    return new Response('ok', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error updating telegram settings:', error);
    return new Response('Ошибка при обновлении настроек Telegram', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
} 