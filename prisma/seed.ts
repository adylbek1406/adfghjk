import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    // Создаем учетные данные админа
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.settings.upsert({
      where: { key: 'admin_credentials' },
      update: {
        value: JSON.stringify({
          login: 'admin',
          password: adminPassword
        })
      },
      create: {
        key: 'admin_credentials',
        value: JSON.stringify({
          login: 'admin',
          password: adminPassword
        })
      }
    });

    console.log('Admin credentials created:', { login: 'admin', password: 'admin123' });

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

    console.log('Database seeding completed successfully');
  } catch (error) {
    console.error('Error during database seeding:', error);
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