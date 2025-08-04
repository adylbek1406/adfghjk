import * as XLSX from 'xlsx';

// Читаем существующий файл
const workbook = XLSX.readFile('products_example.xlsx');

// Создаем новую книгу
const newWorkbook = XLSX.utils.book_new();

// Обрабатываем каждый лист
for (const sheetName of workbook.SheetNames) {
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, any>>;
  
  // Преобразуем данные в нужный формат
  const formattedData = data.map(row => ({
    'Название': String(row['Название'] || ''),
    'Цена': Number(row['Цена'] || 0)
  }));
  
  // Создаем новый лист
  const newWorksheet = XLSX.utils.json_to_sheet(formattedData);
  
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
XLSX.writeFile(newWorkbook, 'products_import_example.xlsx'); 