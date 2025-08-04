import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const prisma = new PrismaClient();

// Секретный ключ для JWT
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { login, password } = await request.json();

    // Получаем учетные данные администратора из базы данных
    const adminSettings = await prisma.settings.findFirst({
      where: { key: 'admin_credentials' }
    });

    if (!adminSettings) {
      return NextResponse.json(
        { error: 'Неверный логин или пароль' },
        { status: 401 }
      );
    }

    const adminCredentials = JSON.parse(adminSettings.value);
    
    // Проверяем логин и пароль
    if (login === adminCredentials.login) {
      const isValidPassword = await bcrypt.compare(password, adminCredentials.password);
      
      if (isValidPassword) {
        // Создаем JWT токен с помощью jose
        const token = await new SignJWT({ userId: 'admin', role: 'admin' })
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('24h')
          .sign(new TextEncoder().encode(JWT_SECRET));

        const response = NextResponse.json(
          { 
            success: true,
            redirect: '/admin'
          },
          { 
            status: 200,
            headers: {
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );

        // Устанавливаем куки с правильными параметрами
        response.cookies.set('auth_token', token, {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24, // 24 часа
          secure: process.env.NODE_ENV === 'production',
          domain: request.headers.get('host')?.split(':')[0] // Получаем домен из заголовка
        });

        return response;
      }
    }

    return NextResponse.json(
      { error: 'Неверный логин или пароль' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Ошибка при попытке входа' },
      { status: 500 }
    );
  }
} 