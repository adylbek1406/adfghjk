import { useState } from 'react';
import { ArrowUpTrayIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImportExportModalProps {
  onClose: () => void;
}

interface ImportReport {
  success: boolean;
  report: {
    categories: {
      added: number;
      deleted: number;
      total: number;
    };
    products: {
      updated: number;
      added: number;
      deleted: number;
      failed: number;
      duplicates: number;
      total: number;
    };
    errors: string[];
  };
}

export default function ImportExportModal({ onClose }: ImportExportModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/products/export');
      if (!response.ok) throw new Error('Ошибка при экспорте');

      // Получаем blob из ответа
      const blob = await response.blob();
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Очищаем
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Ошибка при экспорте файла');
      console.error('Export error:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setReport(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при импорте');
      }

      setReport(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Произошла ошибка при импорте');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Импорт/Экспорт товаров
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <ArrowDownTrayIcon className="h-12 w-12 text-gray-400 mb-4" />
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Экспортировать текущие данные
              </button>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Скачать Excel файл со всеми товарами
              </p>
            </div>

            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mb-4" />
              <label className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleImport}
                  className="hidden"
                  disabled={isUploading}
                />
                {isUploading ? 'Загрузка...' : 'Импортировать данные'}
              </label>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Загрузить Excel файл с обновленными данными
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {report && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold text-lg mb-3">Результаты импорта:</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Категории:</h4>
                    <div className="space-y-1 ml-4">
                      <p>✨ Добавлено: {report.report.categories.added}</p>
                      <p>🗑️ Удалено: {report.report.categories.deleted}</p>
                      <p className="font-medium">Всего изменено: {report.report.categories.total}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Товары:</h4>
                    <div className="space-y-1 ml-4">
                      <p>✅ Добавлено: {report.report.products.added}</p>
                      <p>🔄 Обновлено: {report.report.products.updated}</p>
                      <p>❌ Удалено: {report.report.products.deleted}</p>
                      <p>⚠️ Не удалось обработать: {report.report.products.failed}</p>
                      <p>🔍 Найдено дубликатов: {report.report.products.duplicates}</p>
                      <p className="font-medium">Всего обработано: {report.report.products.total}</p>
                    </div>
                  </div>
                  
                  {report.report.errors.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Ошибки:</h4>
                      <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400 space-y-1 ml-4">
                        {report.report.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 