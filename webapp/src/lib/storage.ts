import type { ScheduleData, DisplaySettings } from '../types/schedule';

const SCHEDULE_KEY = 'tos-schedule-data';
const SETTINGS_KEY = 'tos-display-settings';

export function loadScheduleFromStorage(): ScheduleData | null {
  try {
    const raw = localStorage.getItem(SCHEDULE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ScheduleData;
  } catch {
    return null;
  }
}

export function saveScheduleToStorage(data: ScheduleData): void {
  try {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadSettingsFromStorage(): DisplaySettings | null {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DisplaySettings;
  } catch {
    return null;
  }
}

export function saveSettingsToStorage(settings: DisplaySettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // silently ignore
  }
}
