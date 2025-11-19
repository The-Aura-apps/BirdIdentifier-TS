import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(
    __dirname,
    '..',
    'bird',
    'data',
    'Clements-Checklist-v2024-October-2024.xlsx',
);

const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows: any[] = XLSX.utils.sheet_to_json(sheet);

const catalog = rows
    .filter((row) => row['category'] === 'species')
    .map((row) => ({
        scientificName: row['scientific name'],
        englishName: row['English name'],
    }));

const outputPath = path.join(__dirname, '..', 'bird', 'data', 'clements-catalog-2024.json');

fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
