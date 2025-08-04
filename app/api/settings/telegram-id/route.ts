import { NextResponse } from 'next/server';
import { getTelegramId } from '@/app/lib/db';

export async function GET() {
  try {
    const telegramId = await getTelegramId();
    
    if (!telegramId) {
      return NextResponse.json(
        { error: 'Telegram ID not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ telegramId });
  } catch (error) {
    console.error('Error fetching telegram ID:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 