import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/ru';

const prisma = new PrismaClient();

const PRODUCTS_TO_ADD = 40;

const categories = [
  'Телевизоры',
  'Холодильники',
  'Микроволновки',
  'Пылесосы',
  'Стиральные машины',
  'Кондиционеры',
  'Кухонная техника',
  'Компьютеры'
];

const generateProduct = async (categoryId: string) => {
  const name = faker.commerce.productName();
  const timestamp = Date.now();
  const slug = `${name
    .toLowerCase()
    .replace(/[^a-zA-Zа-яА-Я0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${timestamp}`;

  return {
    name,
    slug,
    description: faker.commerce.productDescription(),
    price: parseFloat(faker.commerce.price({ min: 10000, max: 500000 })),
    isAvailable: true,
    categoryId,
    images: {
      create: Array(3).fill(null).map(() => ({
        url: faker.image.urlLoremFlickr({ category: 'technics' })
      }))
    }
  };
};

async function main() {
  console.log('🚀 Начинаем добавление товаров...');

  try {
    // Получаем существующие категории
    const existingCategories = await prisma.category.findMany();
    
    if (existingCategories.length === 0) {
      console.log('❌ Категории не найдены. Создаём категории...');
      
      for (const categoryName of categories) {
        await prisma.category.create({
          data: {
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
            description: faker.commerce.productDescription()
          }
        });
      }
      
      console.log('✅ Категории созданы успешно');
    }

    // Получаем обновленный список категорий
    const updatedCategories = await prisma.category.findMany();

    // Добавляем продукты
    for (let i = 0; i < PRODUCTS_TO_ADD; i++) {
      const randomCategory = updatedCategories[Math.floor(Math.random() * updatedCategories.length)];
      const productData = await generateProduct(randomCategory.id);

      await prisma.product.create({
        data: productData
      });

      console.log(`✅ Создан товар: ${productData.name}`);
    }

    console.log(`\n✨ Успешно добавлено ${PRODUCTS_TO_ADD} товаров!`);
  } catch (error) {
    console.error('❌ Ошибка при добавлении товаров:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 