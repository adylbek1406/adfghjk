import { NextResponse } from 'next/server';
import { getTelegramId } from '@/app/lib/db';

// Функция для экранирования специальных символов Markdown V2
function escapeMarkdownV2(text: string) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    
    // Получаем telegram_id админа из базы данных
    const adminTelegramId = await getTelegramId();
    if (!adminTelegramId) {
      return NextResponse.json(
        { error: 'Admin Telegram ID not found' },
        { status: 404 }
      );
    }

    // Проверяем наличие необходимых данных
    if (!orderData.items || !Array.isArray(orderData.items)) {
      throw new Error('Invalid items data');
    }

    // Форматируем список товаров
    const itemsList = orderData.items.map((item: any) => {
      // Экранируем специальные символы в названии товара
      const name = escapeMarkdownV2(item.name);
      const quantity = item.quantity;
      const price = parseFloat(String(item.price)) || 0;
      const total = quantity * price;
      const formattedPrice = price.toLocaleString('ru-RU');
      const formattedTotal = total.toLocaleString('ru-RU');

      return `• \`${name}\` \\- ${quantity} шт\\. x ${formattedPrice} сом \\= ${formattedTotal} сом`;
    }).join('\n');

    // Определяем язык общения с клиентом
    const clientLanguage = orderData.language === 'ky' ? 'Кыргызский' : 'Русский';
    
    // Экранируем имя клиента
    const clientName = escapeMarkdownV2(orderData.name || 'Не указано');
    const clientPhone = escapeMarkdownV2(orderData.phone || 'Не указано');

    const formattedTotalSum = orderData.totalSum.toLocaleString('ru-RU');
    const formattedDate = new Date().toLocaleString('ru-RU');

    // Формируем сообщение с использованием Markdown V2
    const message = `🛍️ *Новый заказ\\!*

👤 *Клиент:* ${clientName}
📞 *Телефон:* ${clientPhone}
📱 *Тип связи:* ${orderData.contactType === 'whatsapp' ? 'WhatsApp' : 'Звонок'}
🗣 *Язык клиента:* ${clientLanguage}

🛒 *Товары:*
${itemsList}

💰 *Итого:* ${formattedTotalSum} сом

📅 *Дата заказа:* ${escapeMarkdownV2(formattedDate)}`;

    // Проверяем наличие токена бота
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('Telegram bot token not found');
    }

    // Отправляем сообщение в Telegram с поддержкой Markdown V2
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: adminTelegramId,
          text: message,
          parse_mode: 'MarkdownV2'
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error('Telegram API Error:', telegramData);
      throw new Error(telegramData.description || 'Failed to send message to Telegram');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send order' },
      { status: 500 }
    );
  }
} 