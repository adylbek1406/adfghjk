import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Get featured products
    const products = await prisma.product.findMany({
      take: 50,
      orderBy: {
        name: 'asc'
      },
      include: {
        images: true
      }
    });

    console.log(`Updating ${products.length} products...`);

    // Update each product's images
    for (const product of products) {
      // Delete existing images
      await prisma.image.deleteMany({
        where: {
          productId: product.id
        }
      });

      // Create new images with TV photos
      await prisma.image.createMany({
        data: [
          { url: '/images/tv.jpg', productId: product.id },
          { url: '/images/tv1.jpg', productId: product.id },
          { url: '/images/tv2.jpg', productId: product.id }
        ]
      });

      console.log(`✅ Updated images for product: ${product.name}`);
    }

    console.log('✨ Successfully updated all product images!');
  } catch (error) {
    console.error('Error updating product images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 