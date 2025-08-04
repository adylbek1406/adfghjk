import * as XLSX from 'xlsx';

// Читаем существующий файл
const workbook = XLSX.readFile('products_import_example.xlsx');

// Создаем новую книгу
const newWorkbook = XLSX.utils.book_new();

// Обрабатываем каждый лист
for (const sheetName of workbook.SheetNames) {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as Array<any>;
  
  // Добавляем заголовки и форматируем данные
  const formattedData = [
    ['Название', 'Цена'], // Заголовки
    ...data.map(row => [
      String(row[0]).trim(), // Убираем лишние пробелы из названия
      Number(row[1]) // Преобразуем цену в число
    ])
  ];
  
  // Создаем новый лист
  const newWorksheet = XLSX.utils.aoa_to_sheet(formattedData);
  
  // Устанавливаем ширину столбцов
  const colWidths = [
    { wch: 50 }, // Название
    { wch: 15 }, // Цена
  ];
  newWorksheet['!cols'] = colWidths;
  
  // Добавляем лист в новую книгу
  XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
}

// Сохраняем новый файл
XLSX.writeFile(newWorkbook, 'products_import_fixed.xlsx'); 