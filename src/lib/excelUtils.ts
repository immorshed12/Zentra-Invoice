import * as XLSX from 'xlsx';

export const downloadTemplate = (type: 'products' | 'customers') => {
  let data: any[] = [];
  let fileName = '';

  if (type === 'products') {
    data = [
      {
        'Name (English)': 'Sample Product',
        'Name (Arabic)': 'منتج عينة',
        'Description (English)': 'This is a sample description',
        'Description (Arabic)': 'هذا وصف عينة',
        'Unit Price': 100.00
      }
    ];
    fileName = 'products_template.xlsx';
  } else {
    data = [
      {
        'Name (English)': 'John Doe',
        'Name (Arabic)': 'جون دو',
        'Email': 'john@example.com',
        'Phone': '+966123456789',
        'Tax Number': 'VAT-123456',
        'Salesman': 'Mike Sales',
        'Address (English)': '123 Street, City',
        'Address (Arabic)': '١٢٣ شارع، مدينة',
        'Opening Balance': 500.00
      }
    ];
    fileName = 'customers_template.xlsx';
  }

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  XLSX.writeFile(wb, fileName);
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
