import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.settings.findUnique({
      where: {
        key: 'advertising_pictures'
      }
    });

    const pictures = setting ? JSON.parse(setting.value) : [];
    return NextResponse.json({ pictures });
  } catch (error) {
    console.error('Error fetching advertising pictures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertising pictures' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { pictures } = await request.json();

    if (!Array.isArray(pictures)) {
      return NextResponse.json(
        { error: 'Invalid pictures format' },
        { status: 400 }
      );
    }

    await prisma.settings.upsert({
      where: {
        key: 'advertising_pictures'
      },
      update: {
        value: JSON.stringify(pictures)
      },
      create: {
        key: 'advertising_pictures',
        value: JSON.stringify(pictures)
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating advertising pictures:', error);
    return NextResponse.json(
      { error: 'Failed to update advertising pictures' },
      { status: 500 }
    );
  }
} 