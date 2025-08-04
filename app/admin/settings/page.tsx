'use client';

import { useState, useEffect } from 'react';

interface AdvertisingPictures {
  pictures: string[];
}

export default function SettingsPage() {
  const [telegramId, setTelegramId] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [advertisingPictures, setAdvertisingPictures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState({
    telegram: false,
    credentials: false,
    advertising: false
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [telegramResponse, loginResponse, advertisingResponse] = await Promise.all([
        fetch('/api/admin/settings/telegram'),
        fetch('/api/admin/settings/credentials'),
        fetch('/api/admin/settings/advertising')
      ]);

      if (!telegramResponse.ok || !loginResponse.ok || !advertisingResponse.ok) {
        throw new Error('Ошибка при загрузке настроек');
      }

      const [telegramId, login, advertising] = await Promise.all([
        telegramResponse.text(),
        loginResponse.text(),
        advertisingResponse.json()
      ]);

      setTelegramId(telegramId || '');
      setLogin(login || '');
      setAdvertisingPictures(advertising.pictures || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Ошибка при загрузке настроек');
    }
  };

  const handleTelegramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId) {
      setError('Введите ID Telegram');
      return;
    }

    setIsLoading(prev => ({ ...prev, telegram: true }));
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('telegramId', telegramId);

      const response = await fetch('/api/admin/settings/telegram', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка при обновлении Telegram ID');
      }

      const responseText = await response.text();
      if (responseText === 'ok') {
        setSuccess('Telegram ID успешно обновлен');
      } else {
        throw new Error('Неожиданный ответ от сервера');
      }
    } catch (error) {
      console.error('Error updating telegram ID:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при обновлении Telegram ID');
    } finally {
      setIsLoading(prev => ({ ...prev, telegram: false }));
    }
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login) {
      setError('Введите логин');
      return;
    }

    setIsLoading(prev => ({ ...prev, credentials: true }));
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/settings/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ login, password })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка при обновлении учетных данных');
      }

      const responseText = await response.text();
      if (responseText === 'ok') {
        setSuccess('Учетные данные успешно обновлены');
        setPassword('');
      } else {
        throw new Error('Неожиданный ответ от сервера');
      }
    } catch (error) {
      console.error('Error updating credentials:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при обновлении учетных данных');
    } finally {
      setIsLoading(prev => ({ ...prev, credentials: false }));
    }
  };

  const handleAdvertisingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(prev => ({ ...prev, advertising: true }));
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/settings/advertising', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pictures: advertisingPictures })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Ошибка при обновлении рекламных изображений');
      }

      setSuccess('Рекламные изображения успешно обновлены');
    } catch (error) {
      console.error('Error updating advertising pictures:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при обновлении рекламных изображений');
    } finally {
      setIsLoading(prev => ({ ...prev, advertising: false }));
    }
  };

  const handlePictureChange = (index: number, value: string) => {
    const newPictures = [...advertisingPictures];
    newPictures[index] = value;
    setAdvertisingPictures(newPictures);
  };

  const handleAddPicture = () => {
    setAdvertisingPictures([...advertisingPictures, '']);
  };

  const handleRemovePicture = (index: number) => {
    const newPictures = advertisingPictures.filter((_, i) => i !== index);
    setAdvertisingPictures(newPictures);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Настройки</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-2 rounded-lg mb-4">
          {success}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-6 space-y-8">
        <form onSubmit={handleTelegramSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Telegram</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              ID Telegram
            </label>
            <input
              type="text"
              value={telegramId}
              onChange={(e) => setTelegramId(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="123456789"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-400">
              Введите ваш ID Telegram (только цифры), например: 123456789
            </p>
          </div>
          <button
            type="submit"
            disabled={isLoading.telegram}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading.telegram ? 'Сохранение...' : 'Сохранить Telegram ID'}
          </button>
        </form>

        <div className="border-t border-gray-800 my-6"></div>

        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Учетные данные</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Логин
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Новый пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Оставьте пустым, чтобы не менять"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading.credentials}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading.credentials ? 'Сохранение...' : 'Сохранить учетные данные'}
          </button>
        </form>

        <div className="border-t border-gray-800 my-6"></div>

        <form onSubmit={handleAdvertisingSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Рекламные изображения</h2>
          <div className="space-y-4">
            {advertisingPictures.map((picture, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={picture}
                  onChange={(e) => handlePictureChange(index, e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePicture(index)}
                  className="px-3 py-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddPicture}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              + Добавить изображение
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading.advertising}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isLoading.advertising ? 'Сохранение...' : 'Сохранить рекламные изображения'}
          </button>
        </form>
      </div>
    </div>
  );
} 