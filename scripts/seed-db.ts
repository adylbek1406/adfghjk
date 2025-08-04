import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Применяем миграции
    console.log('Applying migrations...');
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Category" ("id" TEXT NOT NULL, "name" TEXT NOT NULL, "slug" TEXT NOT NULL, "description" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Category_pkey" PRIMARY KEY ("id"));`;
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug");`;
    
    // Создаем админа если его нет
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminSettings = await prisma.settings.upsert({
      where: { key: 'admin_credentials' },
      update: {},
      create: {
        key: 'admin_credentials',
        value: JSON.stringify({
          login: 'admin',
          password: adminPassword
        })
      }
    });

    console.log('Admin credentials created/updated');

    // Создаем тестовую категорию если нет категорий
    const categoriesCount = await prisma.category.count();
    
    if (categoriesCount === 0) {
      await prisma.category.create({
        data: {
          name: 'Тестовая категория',
          slug: 'test-category',
          description: 'Это тестовая категория'
        }
      });
      console.log('Test category created');
    }

    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error during database setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 