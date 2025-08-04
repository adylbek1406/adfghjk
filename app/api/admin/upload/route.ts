import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob;
    const name = formData.get('name') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Создаем безопасное имя файла
    const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}${path.extname(file.name || '.jpg')}`;
    
    // Путь для сохранения файла
    const publicImagesPath = path.join(process.cwd(), 'public', 'images');
    const filePath = path.join(publicImagesPath, fileName);
    
    // Создаем директорию если её нет
    await mkdir(publicImagesPath, { recursive: true });
    
    // Конвертируем Blob в Buffer и сохраняем файл
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Возвращаем относительный URL для сохранения в БД
    const imageUrl = `/images/${fileName}`;
    
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Ошибка при загрузке файла' },
      { status: 500 }
    );
  }
} 