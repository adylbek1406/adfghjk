import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Получаем все категории
    const categories = await prisma.category.findMany({
      include: {
        products: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      }
    });

    // Создаем новую книгу Excel
    const workbook = XLSX.utils.book_new();
    workbook.Props = {
      Title: "Продукты",
      Subject: "Экспорт товаров",
      Author: "Система"
    };

    // Для каждой категории создаем отдельный лист
    for (const category of categories) {
      // Подготавливаем данные для листа
      const sheetData = category.products.map(product => ({
        'ID': product.id,
        'Название': product.name,
        'Цена': product.price
      }));

      // Создаем лист
      const worksheet = XLSX.utils.json_to_sheet(sheetData);

      // Устанавливаем ширину столбцов
      const colWidths = [
        { wch: 40 }, // ID
        { wch: 50 }, // Название
        { wch: 15 }, // Цена
      ];
      worksheet['!cols'] = colWidths;

      // Добавляем лист в книгу
      XLSX.utils.book_append_sheet(workbook, worksheet, category.name);
    }

    // Генерируем файл
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=products.xlsx'
      }
    });
  } catch (error) {
    console.error('Error exporting products:', error);
    return NextResponse.json(
      { error: 'Ошибка при экспорте товаров' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 