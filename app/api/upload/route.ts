import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

// Новый формат конфигурации для Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const slug = formData.get('slug') as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Файлы не найдены' },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { error: 'Не указан slug' },
        { status: 400 }
      );
    }

    const urls: string[] = [];
    let fileNumber = 1;

    // Создаем директорию если её нет
    const publicImagesPath = path.join(process.cwd(), 'public', 'images');
    await mkdir(publicImagesPath, { recursive: true });

    for (const file of files) {
      if (!(file instanceof Blob)) {
        continue;
      }

      // Создаем безопасное имя файла
      const fileName = `${slug}-${fileNumber}-${Date.now()}${path.extname(file.name || '.jpg')}`;
      const filePath = path.join(publicImagesPath, fileName);

      // Конвертируем Blob в Buffer и сохраняем файл
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // Добавляем относительный URL в список
      urls.push(`/images/${fileName}`);
      fileNumber++;
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке файлов' },
      { status: 500 }
    );
  }
} 