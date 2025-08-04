import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { unlink } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; imageId: string } }
) {
  try {
    // Находим изображение
    const image = await prisma.image.findUnique({
      where: {
        id: params.imageId
      }
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Изображение не найдено' },
        { status: 404 }
      );
    }

    // Проверяем, не является ли это изображением по умолчанию
    if (image.url === '/images/product-default.png') {
      return NextResponse.json(
        { error: 'Невозможно удалить изображение по умолчанию' },
        { status: 400 }
      );
    }

    // Удаляем файл, только если это не изображение по умолчанию
    if (!image.url.includes('product-default')) {
      const fileName = path.basename(image.url);
      const filePath = path.join(process.cwd(), 'public', 'images', fileName);
      
      try {
        await unlink(filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
        // Продолжаем выполнение даже если файл не удалось удалить
      }
    }

    // Удаляем запись из базы данных
    await prisma.image.delete({
      where: {
        id: params.imageId
      }
    });

    // Проверяем, остались ли у товара другие изображения
    const remainingImages = await prisma.image.count({
      where: {
        productId: params.id
      }
    });

    // Если изображений не осталось, добавляем изображение по умолчанию
    if (remainingImages === 0) {
      await prisma.image.create({
        data: {
          url: '/images/product-default.png',
          productId: params.id
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Ошибка при удалении изображения' },
      { status: 500 }
    );
  }
} 