import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.resolve(import.meta.dirname, '../../data/settings.json');

const DEFAULTS = {
  fontSizeLaneTitle: 8,
  fontSizeBarText: 7,
  fontSizeMilestone: 7,
  zoomLevel: 'month',
  displayMode: 'fixed',
  showTooltips: true,
  showMemos: true,
  themeMode: 'light',
};

export const settingsRouter = Router();

settingsRouter.get('/', (_req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json(DEFAULTS);
    }
    const stored = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    res.json({ ...DEFAULTS, ...stored });
  } catch {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

settingsRouter.put('/', (req, res) => {
  try {
    const settings = req.body;
    fs.writeFileSync(DATA_FILE, JSON.stringify(settings, null, 2), 'utf-8');
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Failed to save settings' });
  }
});
