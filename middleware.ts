import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function middleware(request: NextRequest) {
  // Добавляем путь в заголовки
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isMainAdminPage = request.nextUrl.pathname === '/admin';
  const isApiAuthRoute = request.nextUrl.pathname === '/api/admin/auth/login';
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  // Логируем информацию о запросе
  console.log('Request path:', request.nextUrl.pathname);
  console.log('Cookies:', request.cookies.getAll());

  // Пропускаем запросы к API авторизации и страницу логина
  if (isApiAuthRoute || isLoginPage) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    return response;
  }

  // Получаем токен из куки
  const token = request.cookies.get('auth_token')?.value;
  console.log('Auth token:', token);

  // Для всех маршрутов админки проверяем наличие токена
  if (isAdminPage) {
    if (!token) {
      console.log('No auth token found, redirecting to login');
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('from', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    try {
      // Проверяем валидность токена
      const secret = new TextEncoder().encode(JWT_SECRET);
      const verified = await jwtVerify(token, secret);
      console.log('Token verified:', verified);
      
      // Если это страница логина и токен валидный, перенаправляем в админку
      if (isLoginPage) {
        console.log('Valid token on login page, redirecting to admin');
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // Получаем текущий язык из cookie
  let language = request.cookies.get('preferred_language')?.value;

  // Если язык не установлен, используем русский по умолчанию
  if (!language || (language !== 'ru' && language !== 'ky')) {
    language = 'ru';
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Устанавливаем cookie с языком, если его нет
  if (!request.cookies.has('preferred_language')) {
    response.cookies.set('preferred_language', language, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 год
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/:path*'
  ]
}; 