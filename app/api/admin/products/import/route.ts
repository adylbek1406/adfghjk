import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Функция для транслитерации
function transliterate(str: string): string {
  const ru = 'а б в г д е ё ж з и й к л м н о п р с т у ф х ц ч ш щ ъ ы ь э ю я'.split(' ');
  const en = 'a b v g d e e zh z i y k l m n o p r s t u f h ts ch sh sch - y - e yu ya'.split(' ');
  const res = str.toLowerCase().split('').map(char => {
    const index = ru.indexOf(char);
    return index >= 0 ? en[index] : char;
  }).join('');
  return res.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Функция для создания изображения по умолчанию
async function createDefaultImage(productId: string) {
  return prisma.image.create({
    data: {
      url: '/images/product-default.png',
      productId: productId
    }
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      );
    }

    // Читаем файл
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const report = {
      categories: {
        added: 0,
        deleted: 0
      },
      products: {
        updated: 0,
        added: 0,
        deleted: 0,
        failed: 0,
        duplicates: 0
      },
      errors: [] as string[]
    };

    // Получаем все существующие категории из БД
    const existingCategories = await prisma.category.findMany();
    const existingCategoryMap = new Map(existingCategories.map(c => [c.name.toLowerCase(), c]));
    const processedCategoryNames = new Set<string>();

    // Создаем или получаем категории из Excel
    const categoryMap = new Map<string, string>(); // name -> id
    for (const sheetName of workbook.SheetNames) {
      const categoryName = sheetName.trim();
      const categoryNameLower = categoryName.toLowerCase();
      processedCategoryNames.add(categoryNameLower);

      let category = existingCategoryMap.get(categoryNameLower);

      if (!category) {
        // Создаем новую категорию
        category = await prisma.category.create({
          data: {
            name: categoryName,
            slug: transliterate(categoryName),
            description: ''
          }
        });
        report.categories.added++;
      }

      categoryMap.set(categoryName, category.id);
    }

    // Удаляем категории, которых нет в Excel
    const categoriesToDelete = Array.from(existingCategoryMap.values())
      .filter(c => !processedCategoryNames.has(c.name.toLowerCase()));

    for (const category of categoriesToDelete) {
      // Сначала удаляем все изображения продуктов этой категории
      const products = await prisma.product.findMany({
        where: { categoryId: category.id },
        select: { id: true }
      });
      
      if (products.length > 0) {
        await prisma.image.deleteMany({
          where: {
            productId: {
              in: products.map(p => p.id)
            }
          }
        });
      }

      // Затем удаляем продукты
      await prisma.product.deleteMany({
        where: { categoryId: category.id }
      });

      // И наконец удаляем саму категорию
      await prisma.category.delete({
        where: { id: category.id }
      });

      report.categories.deleted++;
    }

    // Получаем все существующие продукты по имени и категории
    const existingProducts = await prisma.product.findMany({
      select: { 
        id: true,
        name: true,
        categoryId: true
      }
    });

    const existingProductMap = new Map(
      existingProducts.map(p => [`${p.name.toLowerCase()}-${p.categoryId}`, p.id])
    );
    const processedProductIds = new Set<string>();

    // Обрабатываем каждый лист (категорию)
    for (const sheetName of workbook.SheetNames) {
      const categoryId = categoryMap.get(sheetName);
      if (!categoryId) continue;

      const worksheet = workbook.Sheets[sheetName];
      const products = XLSX.utils.sheet_to_json(worksheet) as Array<{
        'Название': string;
        'Цена': number;
      }>;

      // Обрабатываем каждый продукт
      for (const product of products) {
        try {
          if (!product['Название'] || !product['Цена']) {
            report.products.failed++;
            report.errors.push(`Неверный формат данных для товара в категории "${sheetName}"`);
            continue;
          }

          const productKey = `${product['Название'].toLowerCase()}-${categoryId}`;
          const existingProductId = existingProductMap.get(productKey);
          const slug = transliterate(product['Название']);

          if (existingProductId) {
            // Обновляем существующий продукт
            processedProductIds.add(existingProductId);
            await prisma.product.update({
              where: { id: existingProductId },
              data: {
                name: product['Название'],
                price: product['Цена'],
                categoryId: categoryId,
                slug: slug
              }
            });
            report.products.updated++;
          } else {
            try {
              // Создаем новый продукт с генерацией ID
              const newProductId = crypto.randomUUID();
              const newProduct = await prisma.product.create({
                data: {
                  id: newProductId,
                  name: product['Название'],
                  price: product['Цена'],
                  categoryId: categoryId,
                  description: '',
                  slug: slug,
                  isAvailable: true
                }
              });
              
              // Добавляем изображение по умолчанию
              await createDefaultImage(newProductId);
              
              processedProductIds.add(newProductId);
              report.products.added++;
            } catch (error) {
              if (error instanceof Error && error.message.includes('Unique constraint failed')) {
                report.products.duplicates++;
              } else {
                throw error;
              }
            }
          }
        } catch (error) {
          report.products.failed++;
          report.errors.push(`Ошибка при обработке товара: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
      }
    }

    // Находим и удаляем продукты, которых нет в Excel
    const productsToDelete = existingProducts
      .filter(p => !processedProductIds.has(p.id))
      .map(p => p.id);

    if (productsToDelete.length > 0) {
      // Сначала удаляем все изображения для этих продуктов
      await prisma.image.deleteMany({
        where: {
          productId: {
            in: productsToDelete
          }
        }
      });

      // Затем удаляем сами продукты
      await prisma.product.deleteMany({
        where: {
          id: {
            in: productsToDelete
          }
        }
      });
      report.products.deleted = productsToDelete.length;
    }

    return NextResponse.json({
      success: true,
      report: {
        categories: {
          added: report.categories.added,
          deleted: report.categories.deleted,
          total: report.categories.added + report.categories.deleted
        },
        products: {
          updated: report.products.updated,
          added: report.products.added,
          deleted: report.products.deleted,
          failed: report.products.failed,
          duplicates: report.products.duplicates,
          total: report.products.updated + report.products.added + report.products.deleted + report.products.failed
        },
        errors: report.errors
      }
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Ошибка при импорте товаров' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 