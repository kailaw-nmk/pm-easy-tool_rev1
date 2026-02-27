import fs from 'fs';
import path from 'path';
import { importDrawio } from '../src/lib/drawio-importer';

const DRAWIO_FILE = path.resolve(import.meta.dirname, '../../Tosスケジュール.drawio');
const OUTPUT_FILE = path.resolve(import.meta.dirname, '../data/schedule.json');

console.log('Reading draw.io file:', DRAWIO_FILE);

if (!fs.existsSync(DRAWIO_FILE)) {
  console.error('Error: draw.io file not found:', DRAWIO_FILE);
  process.exit(1);
}

const xmlContent = fs.readFileSync(DRAWIO_FILE, 'utf-8');
console.log('Parsing draw.io XML...');

const data = importDrawio(xmlContent);

console.log(`Imported ${data.pages.length} pages:`);
for (const page of data.pages) {
  const barCount = page.swimLanes.reduce((sum, l) => sum + l.bars.length, 0);
  const msCount = page.swimLanes.reduce((sum, l) => sum + l.milestones.length, 0);
  console.log(`  - ${page.name}: ${page.swimLanes.length} lanes, ${barCount} bars, ${msCount} milestones`);
}

// Ensure output directory exists
const outDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf-8');
console.log(`\nSaved to: ${OUTPUT_FILE}`);
