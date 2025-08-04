import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/admin/settings/credentials
export async function GET() {
  try {
    const setting = await prisma.settings.findFirst({
      where: { key: 'admin_credentials' }
    });

    if (!setting?.value) {
      return new Response('', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const credentials = JSON.parse(setting.value);
    return new Response(credentials.login || '', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error getting credentials:', error);
    return new Response('Ошибка при получении учетных данных', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// POST /api/admin/settings/credentials
export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();

    if (!login) {
      return new Response('Логин не указан', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    // Получаем текущие учетные данные
    const currentSetting = await prisma.settings.findFirst({
      where: { key: 'admin_credentials' }
    });

    let currentCredentials = { login: '', password: '' };
    if (currentSetting?.value) {
      currentCredentials = JSON.parse(currentSetting.value);
    }

    // Если пароль не предоставлен, используем существующий
    const hashedPassword = password 
      ? await bcrypt.hash(password, 10)
      : currentCredentials.password;

    const credentials = {
      login,
      password: hashedPassword
    };

    await prisma.settings.upsert({
      where: { key: 'admin_credentials' },
      update: { value: JSON.stringify(credentials) },
      create: {
        key: 'admin_credentials',
        value: JSON.stringify(credentials)
      }
    });

    return new Response('ok', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error updating credentials:', error);
    return new Response('Ошибка при обновлении учетных данных', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
} 