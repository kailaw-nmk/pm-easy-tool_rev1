import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(import.meta.dirname, '../../data/schedule.json');

export const scheduleRouter = Router();

scheduleRouter.get('/', (_req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.status(404).json({ error: 'Schedule data not found. Run npm run import first.' });
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read schedule data' });
  }
});

scheduleRouter.put('/', (req, res) => {
  try {
    const data = req.body;
    data.lastModified = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ success: true, lastModified: data.lastModified });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save schedule data' });
  }
});
