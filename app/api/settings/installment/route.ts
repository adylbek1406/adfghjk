import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.settings.findUnique({
      where: { key: 'installment' }
    });

    if (!settings) {
      return NextResponse.json({ installments: [] });
    }

    const installments = JSON.parse(settings.value);
    return NextResponse.json({ installments });
  } catch (error) {
    console.error('Error fetching installment settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installment settings' },
      { status: 500 }
    );
  }
} 