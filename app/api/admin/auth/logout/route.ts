import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  
  // Получаем домен из заголовка запроса
  const domain = request.headers.get('host')?.split(':')[0];
  
  // Удаляем куки auth_token с теми же параметрами, с которыми он был установлен
  response.cookies.set('auth_token', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    expires: new Date(0),
    domain: domain
  });

  return response;
} 