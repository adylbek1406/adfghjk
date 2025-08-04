import { v2 as cloudinary } from 'cloudinary';

// Конфигурация Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file: Blob, productName: string): Promise<string> => {
  try {
    // Конвертируем Blob в base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Генерируем имя файла из названия продукта
    const fileName = productName.toLowerCase().replace(/\s+/g, '-');

    // Загружаем изображение в Cloudinary
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: 'products',
      public_id: `${fileName}-${Date.now()}`,
      transformation: [
        { width: 800, height: 800, crop: 'limit' }, // Ограничиваем размер изображения
        { quality: 'auto:good' } // Автоматическая оптимизация качества
      ]
    });

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error('Failed to upload image');
  }
};

export const deleteImage = async (imageUrl: string) => {
  try {
    if (imageUrl.includes('cloudinary.com')) {
      // Извлекаем public_id из URL
      const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
      await cloudinary.uploader.destroy(`products/${publicId}`);
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image');
  }
}; 