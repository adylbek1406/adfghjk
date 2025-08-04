import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Проверяем данные заказа
    if (!data.customer || !data.items || !data.totalSum) {
      return NextResponse.json(
        { error: 'Неверный формат данных заказа' },
        { status: 400 }
      );
    }
    
    // Получаем Telegram ID из настроек
    const telegramSetting = await prisma.settings.findUnique({
      where: { key: 'telegram_id' }
    });
    
    if (!telegramSetting || !telegramSetting.value) {
      return NextResponse.json(
        { error: 'Telegram ID не настроен в системе' },
        { status: 500 }
      );
    }
    
    const telegramId = telegramSetting.value;
    
    // Формируем сообщение для отправки в Telegram
    const message = formatOrderMessage(data);
    
    // Отправляем сообщение в Telegram
    const telegramResponse = await sendTelegramMessage(telegramId, message);
    
    if (!telegramResponse.ok) {
      const telegramError = await telegramResponse.text();
      console.error('Telegram API error:', telegramError);
      throw new Error('Ошибка при отправке сообщения в Telegram');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ошибка при обработке заказа' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Функция для форматирования сообщения заказа
function formatOrderMessage(data: any) {
  const { customer, items, totalSum } = data;
  
  let message = '🛒 *НОВЫЙ ЗАКАЗ*\n\n';
  
  // Информация о клиенте
  message += `👤 *Клиент:* ${customer.fullName}\n`;
  message += `📞 *Тип связи:* ${customer.contactType === 'whatsapp' ? 'WhatsApp' : 'Звонок'}\n`;
  message += `📱 *Контакт:* ${customer.contactInfo}\n\n`;
  
  // Товары
  message += '📋 *Товары:*\n';
  items.forEach((item: any, index: number) => {
    message += `${index + 1}. ${item.name} x ${item.quantity} = ${item.total.toLocaleString('ru-RU')} сом\n`;
  });
  
  // Итого
  message += `\n💰 *Итого:* ${totalSum.toLocaleString('ru-RU')} сом`;
  
  return message;
}

// Функция для отправки сообщения в Telegram
async function sendTelegramMessage(chatId: string, message: string) {
  // Получаем Telegram Bot Token из переменных окружения
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN не настроен в переменных окружения');
  }
  
  // Отправляем сообщение через Telegram Bot API
  return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });
} 