'use server';

import { promises as fs } from 'fs';
import path from 'path';

interface FileWithName extends Blob {
  name?: string;
}

export async function saveImage(file: FileWithName, slug: string): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  // Получаем расширение файла из имени или используем .jpg по умолчанию
  const ext = file.name ? path.extname(file.name).toLowerCase() : '.jpg';
  const fileName = `${slug}${ext}`;
  const publicPath = path.join(process.cwd(), 'public', 'images');
  
  // Создаем директорию, если она не существует
  await fs.mkdir(publicPath, { recursive: true });
  
  const filePath = path.join(publicPath, fileName);
  await fs.writeFile(filePath, buffer);
  
  return `/images/${fileName}`;
}

export async function deleteImage(imageUrl: string) {
  if (!imageUrl) return;
  
  const fileName = path.basename(imageUrl);
  const filePath = path.join(process.cwd(), 'public', 'images', fileName);
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting image:', error);
  }
} 